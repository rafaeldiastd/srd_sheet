import os
import re
import sys
import argparse
import hashlib
import logging
from dataclasses import dataclass, field
from pathlib import Path
import json

# Force UTF-8 output on Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

try:
    import pathspec
except ImportError:
    pathspec = None

"""
Script para exportar código do projeto ou hierarquia de diretórios.

Exemplos de uso:
  python export_codebase.py --tree                      # Exporta hierarquia do projeto inteiro
  python export_codebase.py --tree --path src           # Exporta apenas hierarquia de src/
  python export_codebase.py --tree --path src/main      # Exporta hierarquia específica
  python export_codebase.py --diff                      # Exporta apenas arquivos modificados
  python export_codebase.py --core                      # Exporta preset de arquivos core
"""

# Configurações padrão
DEFAULT_EXTENSIONS = ['.js', '.html', '.css', '.json', '.ts', '.sql', '.tsx', '.mjs', '.vue']
IGNORE_DIRS = ['node_modules', '.git', 'extensions', 'perfis', 'dist', 'build', '.vscode', '.idea', 'coverage', 'docs', 'export', 'scripts', 'backupdeperfil', 'out', 'cache', 'supabase', '.agent', '.github']
IGNORE_FILES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'README.md', 'readme.md', '.export_state.json', 'REPOMIX-QUICKREF.md', 'REPOMIX-README.md', 'repomix.config.json']
DEFAULT_MAX_PART_BYTES = 100_000  # ~100KB (Seguro para a maioria das IAs)
ENC = "utf-8"

# ── Display & Threshold Constants ─────────────────────────────────────
PREVIEW_LINES = 50                 # Lines shown in head/tail preview of large files
LARGE_FILE_THRESHOLD = 500_000     # Bytes — files above this are truncated
HASH_CHUNK_SIZE = 65_536           # Bytes per read chunk in SHA256 hashing
MAX_FLOW_NARRATIVES = 8            # Top N flow narratives to display
MAX_TOP_HUBS = 10                  # Top N hubs/imported modules in graph stats
MAX_INTERNALS_DISPLAY = 15         # Max internal symbols shown per file in map mode
MAX_SKELETON_INTERNALS = 20        # Max internal symbols shown per file in skeleton mode
TYPE_BODY_PREVIEW_LEN = 120        # Max chars of type/interface body to preview
MAX_PATH_SUFFIX_LEN = 50           # Max length before hashing path suffix

# ── Unified Extension → Language Map ──────────────────────────────────
EXT_LANG_MAP = {
    '.js': 'javascript', '.ts': 'typescript', '.tsx': 'tsx',
    '.jsx': 'jsx', '.mjs': 'mjs', '.json': 'json',
    '.html': 'html', '.css': 'css', '.sql': 'sql',
    '.md': 'markdown', '.py': 'python',
}

# ── File Icon Map ─────────────────────────────────────────────────────
FILE_ICON_MAP = {
    '.js': '📜', '.ts': '📘', '.tsx': '⚛️', '.jsx': '⚛️',
    '.json': '📋', '.html': '🌐', '.css': '🎨', '.sql': '🗄️',
    '.md': '📝', '.py': '🐍', '.gitignore': '🚫', '.env': '🔐',
}

# Presets de arquivos para exportação rápida
PRESETS = {
    "backend": ["src/main", "src/preload", "src/shared"],
    "frontend": ["src/renderer"]
}


# ── Logging (P3.1) ───────────────────────────────────────────────────

class JSONLFormatter(logging.Formatter):
    """Emits each log record as a single-line JSON object (JSONL)."""
    def format(self, record):
        from datetime import datetime, timezone
        entry = {
            'ts': datetime.now(timezone.utc).isoformat(),
            'level': record.levelname,
            'msg': record.getMessage(),
        }
        # Merge any extra structured fields passed via log.info('msg', extra={...})
        if hasattr(record, 'data') and record.data:
            entry['data'] = record.data
        return json.dumps(entry, ensure_ascii=False)


def setup_logging(json_mode=False):
    """Configures module-level logger. Call once from main()."""
    logger = logging.getLogger('export')
    logger.setLevel(logging.DEBUG)
    logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    if json_mode:
        handler.setFormatter(JSONLFormatter())
    else:
        handler.setFormatter(logging.Formatter('%(message)s'))
    logger.addHandler(handler)
    return logger


# Default logger — reconfigured in main() when args are available
log = setup_logging(json_mode=False)


def get_git_commit_hash(root_dir):
    """Returns short git commit hash, or None if not in a git repo."""
    import subprocess
    try:
        result = subprocess.run(
            ['git', 'rev-parse', '--short', 'HEAD'],
            cwd=root_dir, capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return None


def estimate_tokens(byte_count):
    """Rough token estimate: ~4 bytes per token for code."""
    return byte_count // 4


def print_token_stats(file_path):
    """Prints token/size stats for a generated artifact."""
    try:
        size_bytes = file_path.stat().st_size
        tokens = estimate_tokens(size_bytes)
        log.info(f"   📏 {size_bytes / 1024:.1f} KB | ~{tokens:,} tokens (estimated)")
    except Exception:
        pass


def copy_to_clipboard(content):
    """Copies content to clipboard if pyperclip is available. Fails silently."""
    try:
        import pyperclip
        pyperclip.copy(content)
        log.info("\n📋 Conteúdo copiado para a área de transferência!")
    except ImportError:
        pass
    except Exception:
        pass


def _safe_read_text(path, encoding=ENC):
    """Reads file content with standardized error handling.

    Returns the file content as string, or None on any read/decode error.
    Centralizes the try/except pattern used by 8+ functions.
    """
    try:
        return path.read_text(encoding=encoding, errors='replace')
    except (OSError, UnicodeDecodeError) as e:
        log.warning(f"Cannot read {path}: {e}")
        return None


def generate_manifest(root_dir, out_dir, mode, files, commit_hash=None,
                      filters=None, excluded_count=0):
    """Generates MANIFEST.json with metadata about exported files."""
    from datetime import datetime, timezone

    file_entries = []
    total_bytes = 0
    total_lines = 0
    for f in sorted(files, key=lambda p: p.relative_to(root_dir).as_posix()):
        rel = f.relative_to(root_dir).as_posix()
        content = _safe_read_text(f)
        if content is not None:
            size = len(content.encode(ENC))
            lines = content.count('\n') + 1
        else:
            size = 0
            lines = 0
        total_bytes += size
        total_lines += lines
        file_entries.append({
            'path': rel,
            'lang': EXT_LANG_MAP.get(f.suffix.lower(), f.suffix.lstrip('.')),
            'bytes': size,
            'lines': lines,
        })

    manifest = {
        'root': root_dir.name,
        'mode': mode,
        'commit': commit_hash,
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'filters': filters or {},
        'summary': {
            'total_files': len(file_entries),
            'excluded_files': excluded_count,
            'total_bytes': total_bytes,
            'total_lines': total_lines,
            'estimated_tokens': estimate_tokens(total_bytes),
        },
        'files': file_entries,
    }

    manifest_path = out_dir / 'MANIFEST.json'
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding=ENC)
    log.info(f"   📄 MANIFEST.json written ({len(file_entries)} files cataloged)")
    return manifest_path

def load_gitignore_spec(root_dir):
    """Carrega .gitignore + .git/info/exclude como pathspec."""
    if pathspec is None:
        return None
    patterns = []
    for gi_path in [root_dir / '.gitignore', root_dir / '.git' / 'info' / 'exclude']:
        if gi_path.is_file():
            try:
                patterns.extend(gi_path.read_text(encoding=ENC).splitlines())
            except Exception:
                pass
    if not patterns:
        return None
    return pathspec.PathSpec.from_lines('gitwildmatch', patterns)


def load_path_aliases(root_dir):
    """Lê tsconfig.json e retorna mapa de aliases {prefix: resolved_dir}."""
    tsconfig = root_dir / 'tsconfig.json'
    if not tsconfig.is_file():
        return {}
    try:
        raw = tsconfig.read_text(encoding=ENC)
        # Remove comentários simples (// ...)
        raw = re.sub(r'//.*$', '', raw, flags=re.MULTILINE)
        data = json.loads(raw)
        paths = data.get('compilerOptions', {}).get('paths', {})
        base_url = data.get('compilerOptions', {}).get('baseUrl', '.')
        base_dir = (root_dir / base_url).resolve()
        aliases = {}
        for alias, targets in paths.items():
            if targets and alias.endswith('/*'):
                prefix = alias[:-2]  # '@shared'
                target_dir = targets[0][:-2] if targets[0].endswith('/*') else targets[0]
                aliases[prefix] = (base_dir / target_dir).resolve()
        return aliases
    except Exception:
        return {}

@dataclass
class ExportConfig:
    """Encapsulates runtime configuration — replaces module-level global state.

    Created once in main() from CLI args. Passed implicitly via module-level
    _config for backward compatibility with functions that don't accept it
    as a parameter (yet).
    """
    gitignore_spec: object = None        # pathspec.PathSpec or None
    extra_ignores: list = field(default_factory=list)
    pretty_json_mode: bool = False
    path_aliases_cache: dict = field(default_factory=dict)


# Module-level config instance — set by main(), read by functions
_config = ExportConfig()

def is_ignored(path, root_dir, gitignore_spec=None, extra_ignores=None):
    """Verifica se o arquivo ou diretório deve ser ignorado."""
    rel_path = path.relative_to(root_dir)
    parts = rel_path.parts

    # Gitignore spec (parameter overrides config)
    spec = gitignore_spec or _config.gitignore_spec
    if spec is not None:
        rel_posix = rel_path.as_posix()
        if path.is_dir():
            rel_posix += '/'
        if spec.match_file(rel_posix):
            return True

    # Extra ignores (parameter overrides config)
    ignores = extra_ignores or _config.extra_ignores
    if ignores:
        for pat in ignores:
            if rel_path.match(pat):
                return True

    # Fallback: ignora diretórios proibidos
    for part in parts:
        if part in IGNORE_DIRS:
            return True

    # Ignora arquivos específicos
    if path.name in IGNORE_FILES:
        return True

    # Ignora arquivos .repomix-*
    if path.name.startswith('.repomix'):
        return True

    return False


def collect_files(root_dir, target_paths, extensions=None):
    """Collects files from target_paths, filtering by extensions and ignore rules.

    Consolidates the repeated os.walk + is_ignored + extension filtering pattern.
    Uses a generator internally but returns a sorted list for deterministic output.

    Args:
        root_dir: Project root Path for is_ignored() checks.
        target_paths: List of Path objects (files or dirs) to scan.
        extensions: Set/list of allowed extensions (e.g. {'.ts', '.tsx'}).
                    If None, accepts all non-ignored files.

    Returns:
        Sorted list of Path objects matching the criteria.
    """
    seen = set()

    def _walk(target_paths, extensions):
        for target_path in target_paths:
            if target_path.is_file():
                if not is_ignored(target_path, root_dir):
                    if extensions is None or target_path.suffix.lower() in extensions:
                        key = target_path.resolve()
                        if key not in seen:
                            seen.add(key)
                            yield target_path
            else:
                for root, dirs, filenames in os.walk(target_path):
                    dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
                    for name in filenames:
                        fp = Path(root) / name
                        if not is_ignored(fp, root_dir):
                            if extensions is None or fp.suffix.lower() in extensions:
                                key = fp.resolve()
                                if key not in seen:
                                    seen.add(key)
                                    yield fp

    files = list(_walk(target_paths, extensions))
    files.sort(key=lambda p: p.relative_to(root_dir).as_posix())
    return files


def get_code_block(path, root_dir, pretty_json=False):
    """Lê o arquivo e retorna formatado como bloco de código Markdown."""
    rel_path = path.relative_to(root_dir).as_posix()
    ext = path.suffix.lower()
    lang = EXT_LANG_MAP.get(ext, ext.lstrip('.'))

    content = _safe_read_text(path)
    if content is not None:
        size_kb = len(content.encode(ENC)) / 1024
        is_minified = len(content) > 1000 and content.count('\n') < 5
        is_large = len(content) > LARGE_FILE_THRESHOLD

        # Pretty-print JSON minificado
        if pretty_json and ext == '.json' and is_minified:
            try:
                parsed = json.loads(content)
                content = json.dumps(parsed, indent=2, ensure_ascii=False)
                is_minified = False
            except Exception:
                pass

        # Arquivo grande ou minificado: preview em vez de None
        if is_large or is_minified:
            lines_list = content.splitlines()
            head = '\n'.join(lines_list[:PREVIEW_LINES])
            tail = '\n'.join(lines_list[-PREVIEW_LINES:]) if len(lines_list) > PREVIEW_LINES else ''
            reason = f'minified ({size_kb:.0f}KB)' if is_minified else f'too large ({size_kb:.0f}KB)'
            truncated_block = (
                f"\n\n---\n"
                f"## FILE: {rel_path} [TRUNCATED: {reason}, first/last {PREVIEW_LINES} lines]\n"
                f"```{lang}\n{head}\n"
            )
            if tail:
                truncated_block += f"\n// === TRUNCATED ({len(lines_list)} lines total) ===\n\n{tail}\n"
            truncated_block += f"```\n"
            return truncated_block

        return (
            f"\n\n---\n"
            f"## FILE: {rel_path}\n"
            f"```{lang}\n{content}\n```\n"
        )
    else:
        return None

def _split_block_by_lines(block, max_bytes):
    """Divide um bloco grande em sub-chunks por ranges de linhas."""
    lines = block.splitlines(keepends=True)
    # Extrai header (## FILE: ...)
    header_end = 0
    file_header = ''
    for i, line in enumerate(lines):
        if line.startswith('```') and i > 0:
            header_end = i + 1
            file_header = ''.join(lines[:header_end - 1])  # Sem o ``` de abertura
            break

    # Extrai lang da primeira ``` line
    lang_line = lines[header_end - 1] if header_end > 0 else '```\n'

    content_lines = lines[header_end:-1] if lines[-1].startswith('```') else lines[header_end:]
    chunks = []
    chunk_lines = []
    chunk_bytes = 0
    total_parts = max(1, (sum(len(l.encode(ENC)) for l in content_lines) // max_bytes) + 1)

    for line in content_lines:
        line_bytes = len(line.encode(ENC))
        if chunk_bytes + line_bytes > max_bytes and chunk_lines:
            part_num = len(chunks) + 1
            chunk_content = ''.join(chunk_lines)
            sub = f"{file_header} (part {part_num}/{total_parts})\n{lang_line}{chunk_content}```\n"
            chunks.append(sub)
            chunk_lines = []
            chunk_bytes = 0
        chunk_lines.append(line)
        chunk_bytes += line_bytes

    if chunk_lines:
        part_num = len(chunks) + 1
        chunk_content = ''.join(chunk_lines)
        sub = f"{file_header} (part {part_num}/{total_parts})\n{lang_line}{chunk_content}```\n"
        chunks.append(sub)

    return chunks if len(chunks) > 1 else [block]


def write_parts(blocks, out_dir, max_bytes):
    """Escreve os blocos em arquivos separados se exceder o tamanho máximo."""
    part_idx = 1
    buf = []
    buf_bytes = 0

    def flush():
        nonlocal part_idx, buf, buf_bytes
        if not buf:
            return

        out_file = out_dir / f"PROJECT_CODE_PART_{part_idx:03d}.md"
        out_file.write_text("".join(buf), encoding=ENC)
        log.info(f"✅ Gerado: {out_file.name} ({buf_bytes/1024:.2f} KB)")

        part_idx += 1
        buf = []
        buf_bytes = 0

    for block in blocks:
        if not block: continue

        block_bytes = len(block.encode(ENC))

        # Bloco maior que o limite: tenta dividir por linhas
        if block_bytes > max_bytes:
            if buf: flush()
            sub_chunks = _split_block_by_lines(block, max_bytes)
            for sub in sub_chunks:
                buf.append(sub)
                buf_bytes = len(sub.encode(ENC))
                flush()
            continue

        if buf_bytes + block_bytes > max_bytes:
            flush()

        buf.append(block)
        buf_bytes += block_bytes

    flush()

def load_state(state_file):
    """Carrega o estado anterior das datas de modificação."""
    if state_file.exists():
        try:
            return json.loads(state_file.read_text(encoding=ENC))
        except (OSError, json.JSONDecodeError):
            return {}
    return {}

def save_state(state_file, state):
    """Salva o estado atual das datas de modificação."""
    state_file.write_text(json.dumps(state, indent=2), encoding=ENC)


# ── Incremental Cache (P3.2) ─────────────────────────────────────────

def file_content_hash(file_path):
    """Computes SHA256 hash of file contents. Reads in chunks for efficiency."""
    h = hashlib.sha256()
    try:
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(HASH_CHUNK_SIZE), b''):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return None


class SymbolCache:
    """Persistent cache for extracted symbols, keyed by file content SHA256.

    Stores results from extract_detailed_exports() and extract_internals()
    so that unchanged files are not re-parsed on subsequent runs.
    Cache file: <root>/.export_cache/symbols.json
    """

    def __init__(self, root_dir):
        self.cache_dir = root_dir / '.export_cache'
        self.cache_file = self.cache_dir / 'symbols.json'
        self._data = self._load()
        self._dirty = False

    def _load(self):
        if self.cache_file.exists():
            try:
                return json.loads(self.cache_file.read_text(encoding=ENC))
            except Exception:
                return {}
        return {}

    def save(self):
        """Persist cache to disk (only if modified)."""
        if not self._dirty:
            return
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.cache_file.write_text(
            json.dumps(self._data, indent=1, ensure_ascii=False),
            encoding=ENC,
        )
        log.info(f"   💾 Symbol cache saved ({len(self._data)} entries)")

    def get(self, rel_path, content_hash, key):
        """Returns cached result if hash matches, else None."""
        entry = self._data.get(rel_path)
        if entry and entry.get('hash') == content_hash:
            return entry.get(key)
        return None

    def put(self, rel_path, content_hash, key, value):
        """Stores a result in the cache."""
        if rel_path not in self._data:
            self._data[rel_path] = {'hash': content_hash}
        entry = self._data[rel_path]
        if entry.get('hash') != content_hash:
            # Hash changed — reset all cached keys for this file
            self._data[rel_path] = {'hash': content_hash}
        self._data[rel_path][key] = value
        self._dirty = True

    def stats(self):
        """Returns (hits, misses) counters — call after processing."""
        return getattr(self, '_hits', 0), getattr(self, '_misses', 0)

    def record_hit(self):
        self._hits = getattr(self, '_hits', 0) + 1

    def record_miss(self):
        self._misses = getattr(self, '_misses', 0) + 1


# Module-level cache — initialized in main()
_symbol_cache = None

def build_tree_structure(path, root_dir, prefix="", is_last=True, is_root=False):
    """Constrói representação em árvore de diretórios e arquivos."""
    if is_ignored(path, root_dir):
        return []
    
    lines = []
    
    if is_root:
        connector = ""
    else:
        connector = "└── " if is_last else "├── "
    
    if path.is_file():
        lines.append(f"{prefix}{connector}{path.name}")
    else:
        lines.append(f"{prefix}{connector}{path.name}/")
        
        # Lista conteúdo do diretório
        try:
            children = sorted(path.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower()))
            # Filtra ignorados
            children = [c for c in children if not is_ignored(c, root_dir)]
            
            for i, child in enumerate(children):
                is_last_child = (i == len(children) - 1)
                extension = "" if is_root else ("    " if is_last else "│   ")
                child_lines = build_tree_structure(
                    child, 
                    root_dir, 
                    prefix + extension, 
                    is_last_child,
                    False
                )
                lines.extend(child_lines)
        except PermissionError:
            pass
    
    return lines

def get_file_icon(extension):
    """Retorna emoji baseado na extensão do arquivo."""
    return FILE_ICON_MAP.get(extension.lower(), '📄')

def generate_tree_export(root_dir, out_dir, target_paths):
    """Gera arquivo Markdown com hierarquia visual de pastas/arquivos."""
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    lines = [
        "# Project Structure\n",
        f"**Root:** `{root_dir.name}`\n",
        f"**Generated:** {timestamp}\n",
        "---\n"
    ]
    
    # Para cada path alvo, gera a árvore
    for target_path in target_paths:
        rel_path = target_path.relative_to(root_dir) if target_path != root_dir else Path(".")
        
        lines.append(f"\n## {rel_path if str(rel_path) != '.' else 'Root'}\n")
        lines.append("```")
        
        if target_path.is_file():
            lines.append(target_path.name)
        else:
            tree_lines = build_tree_structure(target_path, root_dir, "", True, True)
            lines.extend(tree_lines)
        
        lines.append("```\n")
    
    # Estatísticas
    lines.append("\n---\n")
    lines.append("## Statistics\n")
    
    total_files = 0
    total_dirs = 0
    ext_count = {}
    
    for target_path in target_paths:
        if target_path.is_file():
            total_files += 1
            ext = target_path.suffix or 'no extension'
            ext_count[ext] = ext_count.get(ext, 0) + 1
        else:
            for root, dirs, files in os.walk(target_path):
                root_path = Path(root)
                if is_ignored(root_path, root_dir):
                    continue
                    
                dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
                total_dirs += len(dirs)
                
                for f in files:
                    file_path = root_path / f
                    if not is_ignored(file_path, root_dir):
                        total_files += 1
                        ext = (Path(f).suffix or Path(f).name).lower()
                        ext_count[ext] = ext_count.get(ext, 0) + 1
    
    lines.append(f"- **Total Directories:** {total_dirs}")
    lines.append(f"- **Total Files:** {total_files}\n")
    
    if ext_count:
        lines.append("### Files by Extension\n")
        for ext, count in sorted(ext_count.items(), key=lambda x: x[1], reverse=True):
            lines.append(f"- `{ext}`: {count}")
    
    # Salva arquivo
    output_file = out_dir / "PROJECT_TREE.md"
    output_file.write_text("\n".join(lines), encoding=ENC)
    
    log.info(f"\n🌳 Tree Structure Exported: {output_file}")
    log.info(f"   📁 {total_dirs} directories")
    log.info(f"   📄 {total_files} files")
    
    return output_file

# ── Doc Mode ──────────────────────────────────────────────────────────

IMPORT_EXTENSIONS = {'.ts', '.tsx', '.mjs', '.js', '.jsx'}
# Captura imports relativos e de alias (não só ./)
IMPORT_RE = re.compile(r"""^import\s+.*?from\s+['"](\.*[^'"]+)['"]""", re.MULTILINE)

# Regex para exports (RepoMap)
EXPORT_FUNC_RE = re.compile(r'^export\s+(?:async\s+)?function\s+(\w+)\s*(<[^>]*>)?\s*\(([^)]*)\)', re.MULTILINE)
EXPORT_CLASS_RE = re.compile(r'^export\s+(?:default\s+)?class\s+(\w+)', re.MULTILINE)
EXPORT_CONST_RE = re.compile(r'^export\s+(?:const|let|var)\s+(\w+)', re.MULTILINE)
EXPORT_IFACE_RE = re.compile(r'^export\s+(?:interface|type)\s+(\w+)', re.MULTILINE)
EXPORT_DEFAULT_RE = re.compile(r'^export\s+default\s+(\w+)', re.MULTILINE)

# Regex para IPC (Behavior Maps)
REGISTER_IPC_RE = re.compile(r"""registerIpc\s*\(\s*['"]([^'"]+)['"]""", re.MULTILINE)
CONTEXT_BRIDGE_RE = re.compile(r"""contextBridge\.exposeInMainWorld\s*\(\s*['"]([^'"]+)['"]""", re.MULTILINE)
INVOKE_IPC_RE = re.compile(r"""invokeIpc\s*(?:<[^>]*>)?\s*\(\s*['"]([^'"]+)['"]""", re.MULTILINE)
# Regex para IPC com tipos de request
REGISTER_IPC_TYPED_RE = re.compile(
    r"""registerIpc\s*\(\s*['"]([^'"]+)['"]\s*,\s*async\s*\([^)]*?(?:\{[^}]*\}\s*:\s*(\{[^}]+\}))?\)""",
    re.MULTILINE | re.DOTALL
)

# ── Import/Export Regex (unified) ─────────────────────────────────────

# Named imports: import { A, B } from './path'
NAMED_IMPORT_RE = re.compile(
    r"""^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]""",
    re.MULTILINE
)
# import type { A } from './path'
IMPORT_TYPE_RE = re.compile(
    r"""^import\s+type\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]""",
    re.MULTILINE
)
# Default import: import Foo from './path'
DEFAULT_IMPORT_RE = re.compile(
    r"""^import\s+(\w+)\s+from\s+['"]([^'"]+)['"]""",
    re.MULTILINE
)
# Namespace import: import * as Foo from './path'
NAMESPACE_IMPORT_RE = re.compile(
    r"""^import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]""",
    re.MULTILINE
)
# export * from './path'
EXPORT_STAR_RE = re.compile(
    r"""^export\s+\*\s+from\s+['"]([^'"]+)['"]""",
    re.MULTILINE
)
# export { A, B } from './path'  /  export type { A } from './path'
EXPORT_NAMED_FROM_RE = re.compile(
    r"""^export\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]""",
    re.MULTILINE
)
# Export function with return type
MAP_EXPORT_FUNC_RE = re.compile(
    r'^export\s+(?:async\s+)?function\s+(\w+)\s*(<[^>]*>)?\s*\(([^)]*)\)(?:\s*:\s*([^{]+?))?\s*\{',
    re.MULTILINE
)
# Internal (non-exported) functions
INTERNAL_FUNC_RE = re.compile(
    r'^(?:async\s+)?function\s+(\w+)\s*(<[^>]*>)?\s*\(([^)]*)\)(?:\s*:\s*([^{]+?))?\s*\{',
    re.MULTILINE
)
# Internal const/let/var (non-exported)
INTERNAL_VAR_RE = re.compile(
    r'^(?:const|let|var)\s+(\w+)(?:\s*:\s*([^=]+?))?\s*=',
    re.MULTILINE
)
# Exported const/let with type
MAP_EXPORT_CONST_RE = re.compile(
    r'^export\s+(?:const|let|var)\s+(\w+)(?:\s*:\s*([^=]+?))?\s*=',
    re.MULTILINE
)
# Type/Interface exports with body preview
MAP_EXPORT_TYPE_RE = re.compile(
    r'^export\s+(?:interface|type)\s+(\w+)(?:<[^>]*>)?\s*[={]([^}]*?)(?:\}|$)',
    re.MULTILINE | re.DOTALL
)

# Cache para aliases — lives in _config.path_aliases_cache

def _resolve_import_source(raw, file_path, root_dir):
    """Resolve um import source string para um path real no filesystem."""

    # Tenta resolver via alias primeiro
    if not raw.startswith('.'):
        if not _config.path_aliases_cache:
            _config.path_aliases_cache = load_path_aliases(root_dir)
        for prefix, target_dir in _config.path_aliases_cache.items():
            if raw == prefix or raw.startswith(prefix + '/'):
                remainder = raw[len(prefix):].lstrip('/')
                resolved = (target_dir / remainder).resolve() if remainder else target_dir.resolve()
                break
        else:
            return None  # pacote externo (npm etc)
    else:
        resolved = (file_path.parent / raw).resolve()

    # Tenta encontrar o arquivo real
    target = None
    if resolved.is_file():
        target = resolved
    else:
        for ext in IMPORT_EXTENSIONS:
            candidate = resolved.with_suffix(ext)
            if candidate.exists():
                target = candidate
                break
        if not target and resolved.is_dir():
            for ext in IMPORT_EXTENSIONS:
                candidate = resolved / f"index{ext}"
                if candidate.exists():
                    target = candidate
                    break

    if target:
        try:
            return target.relative_to(root_dir).as_posix()
        except ValueError:
            pass
    return None


def parse_all_imports(file_path, root_dir):
    """Extrai TODOS os imports de um arquivo TS/TSX com detalhes e resolução de path."""
    content = _safe_read_text(file_path)
    if content is None:
        return []

    imports = []

    # import type { A, B } from './path'
    for m in IMPORT_TYPE_RE.finditer(content):
        names = [n.strip().split(' as ') for n in m.group(1).split(',')]
        source = m.group(2)
        resolved = _resolve_import_source(source, file_path, root_dir)
        for parts in names:
            original = parts[0].strip()
            alias = parts[1].strip() if len(parts) > 1 else None
            if original:
                imports.append({'kind': 'type', 'name': original, 'alias': alias, 'source': source, 'resolved': resolved})

    # import { A, B } from './path'
    for m in NAMED_IMPORT_RE.finditer(content):
        names = [n.strip().split(' as ') for n in m.group(1).split(',')]
        source = m.group(2)
        resolved = _resolve_import_source(source, file_path, root_dir)
        for parts in names:
            original = parts[0].strip()
            alias = parts[1].strip() if len(parts) > 1 else None
            if original:
                imports.append({'kind': 'named', 'name': original, 'alias': alias, 'source': source, 'resolved': resolved})

    # import Foo from './path'
    for m in DEFAULT_IMPORT_RE.finditer(content):
        name = m.group(1)
        source = m.group(2)
        if name in ('{', '*', 'type'):
            continue
        resolved = _resolve_import_source(source, file_path, root_dir)
        imports.append({'kind': 'default', 'name': name, 'alias': None, 'source': source, 'resolved': resolved})

    # import * as Foo from './path'
    for m in NAMESPACE_IMPORT_RE.finditer(content):
        source = m.group(2)
        resolved = _resolve_import_source(source, file_path, root_dir)
        imports.append({'kind': 'namespace', 'name': f'* as {m.group(1)}', 'alias': m.group(1), 'source': source, 'resolved': resolved})

    return imports


def parse_imports(file_path, root_dir):
    """Extrai edges de dependência entre arquivos (wrapper sobre parse_all_imports)."""
    src_rel = file_path.relative_to(root_dir).as_posix()
    edges = []
    seen = set()
    for imp in parse_all_imports(file_path, root_dir):
        resolved = imp['resolved']
        if resolved and resolved not in seen:
            seen.add(resolved)
            edges.append((src_rel, resolved))
    return edges


def parse_named_imports(file_path, root_dir):
    """Wrapper de compatibilidade: retorna lista de dicts para o Map mode."""
    return parse_all_imports(file_path, root_dir)

def build_dependency_graph(files, root_dir):
    """Constrói grafo de dependências a partir de lista de arquivos."""
    edges = []
    nodes = set()
    for f in files:
        rel = f.relative_to(root_dir).as_posix()
        nodes.add(rel)
        for src, tgt in parse_imports(f, root_dir):
            edges.append((src, tgt))
            nodes.add(tgt)
    return nodes, edges

# ── RepoMap ───────────────────────────────────────────────────────────

def extract_exports(file_path):
    """Extrai símbolos exportados de um arquivo TS/TSX."""
    content = _safe_read_text(file_path)
    if content is None:
        return []

    symbols = []
    for m in EXPORT_FUNC_RE.finditer(content):
        name = m.group(1)
        generics = m.group(2) or ''
        params = m.group(3).strip()
        symbols.append(('fn', f'{name}{generics}({params})'))
    for m in EXPORT_CLASS_RE.finditer(content):
        symbols.append(('class', m.group(1)))
    for m in EXPORT_CONST_RE.finditer(content):
        symbols.append(('const', m.group(1)))
    for m in EXPORT_IFACE_RE.finditer(content):
        symbols.append(('type', m.group(1)))
    for m in EXPORT_DEFAULT_RE.finditer(content):
        name = m.group(1)
        if not any(name == s[1].split('(')[0] for s in symbols):
            symbols.append(('default', name))
    return symbols

def build_repo_map(files, root_dir):
    """Constrói mapa de símbolos exportados por arquivo."""
    repo_map = {}
    for f in files:
        rel = f.relative_to(root_dir).as_posix()
        symbols = extract_exports(f)
        if symbols:
            repo_map[rel] = symbols
    return repo_map

# ── Behavior Maps ─────────────────────────────────────────────────────

def extract_ipc_channels(files, root_dir):
    """Extrai canais IPC registrados com tipos de request."""
    channels = []
    for f in files:
        rel = f.relative_to(root_dir).as_posix()
        try:
            content = f.read_text(encoding=ENC)
        except Exception:
            continue
        # Tenta a versão typed primeiro
        typed_channels = set()
        for m in REGISTER_IPC_TYPED_RE.finditer(content):
            ch_name = m.group(1)
            req_type = m.group(2)  # pode ser None
            typed_channels.add(ch_name)
            channels.append({
                'channel': ch_name,
                'handler': _short_name(rel),
                'request': req_type.strip() if req_type else '—',
            })
        # Fallback: pega channels que a typed não capturou
        for m in REGISTER_IPC_RE.finditer(content):
            ch_name = m.group(1)
            if ch_name not in typed_channels:
                channels.append({
                    'channel': ch_name,
                    'handler': _short_name(rel),
                    'request': '—',
                })
    return sorted(channels, key=lambda c: c['channel'])

def extract_preload_bridge(files, root_dir):
    """Extrai APIs expostas pelo preload via contextBridge."""
    bridges = []
    for f in files:
        rel = f.relative_to(root_dir).as_posix()
        try:
            content = f.read_text(encoding=ENC)
        except Exception:
            continue
        for m in CONTEXT_BRIDGE_RE.finditer(content):
            api_name = m.group(1)
            invocations = sorted(set(im.group(1) for im in INVOKE_IPC_RE.finditer(content)))
            bridges.append({'api': api_name, 'file': _short_name(rel), 'channels': invocations})
    return bridges

# ── Flow Narratives ──────────────────────────────────────────────────

def generate_flow_narratives(ipc_channels, edge_map):
    """Gera narrativas dos fluxos críticos baseado nos IPC handlers."""
    # Agrupa channels por handler
    handler_channels = {}
    for ch in ipc_channels:
        handler_channels.setdefault(ch['handler'], []).append(ch['channel'])

    # Para cada handler, descobre deps diretas (profundidade 2)
    flows = []
    for handler, channels in sorted(handler_channels.items()):
        # Reconstrói o path relativo do handler
        handler_candidates = [k for k in edge_map.keys() if _short_name(k) == handler]
        if not handler_candidates:
            continue
        handler_path = handler_candidates[0]
        direct_deps = edge_map.get(handler_path, set())
        # Deps de profundidade 2
        deep_deps = set()
        for dep in direct_deps:
            deep_deps.update(edge_map.get(dep, set()))
        deep_deps -= direct_deps  # só as novas

        chain_parts = [f'`{_short_name(d)}`' for d in sorted(direct_deps)]
        deep_parts = [f'`{_short_name(d)}`' for d in sorted(deep_deps)] if deep_deps else []

        flow = {
            'handler': handler,
            'channels': channels,
            'direct': chain_parts,
            'deep': deep_parts,
        }
        flows.append(flow)

    # Ordena por número de channels (mais importante primeiro)
    flows.sort(key=lambda f: len(f['channels']), reverse=True)
    return flows[:MAX_FLOW_NARRATIVES]  # Top N fluxos

# ── Graph Ranking ─────────────────────────────────────────────────────

def compute_graph_stats(nodes, edges):
    """Calcula in-degree, out-degree e detecta ciclos."""
    in_deg = {n: 0 for n in nodes}
    out_deg = {n: 0 for n in nodes}
    adj = {n: set() for n in nodes}

    seen_edges = set()
    for src, tgt in edges:
        pair = (src, tgt)
        if pair in seen_edges:
            continue
        seen_edges.add(pair)
        out_deg[src] = out_deg.get(src, 0) + 1
        in_deg[tgt] = in_deg.get(tgt, 0) + 1
        adj.setdefault(src, set()).add(tgt)

    # Detectar ciclos via DFS
    cycles = []
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {n: WHITE for n in nodes}
    path = []

    def dfs(u):
        color[u] = GRAY
        path.append(u)
        for v in sorted(adj.get(u, [])):
            if v not in color:
                continue
            if color[v] == GRAY:
                idx = path.index(v)
                cycle = path[idx:] + [v]
                cycles.append([_short_name(c) for c in cycle])
            elif color[v] == WHITE:
                dfs(v)
        path.pop()
        color[u] = BLACK

    for n in sorted(nodes):
        if color[n] == WHITE:
            dfs(n)

    # Top hubs por importância (in + out)
    importance = {n: in_deg.get(n, 0) + out_deg.get(n, 0) for n in nodes}
    top_hubs = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:MAX_TOP_HUBS]

    # Top importados (in-degree)
    top_imported = sorted(in_deg.items(), key=lambda x: x[1], reverse=True)[:MAX_TOP_HUBS]

    return {
        'in_deg': in_deg,
        'out_deg': out_deg,
        'cycles': cycles,
        'top_hubs': top_hubs,
        'top_imported': top_imported,
    }

def _short_name(rel_path):
    """Simplifica caminho para exibição no diagrama."""
    # Remove src/ prefix e extensão
    name = rel_path
    if name.startswith('src/'):
        name = name[4:]
    # Remove extensão
    for ext in ('.ts', '.tsx', '.js', '.jsx', '.mjs'):
        if name.endswith(ext):
            name = name[:-len(ext)]
            break
    return name

def _layer_key(rel_path):
    """Determina a camada/grupo de um módulo para subgraphs."""
    short = _short_name(rel_path)
    parts = short.split('/')
    if len(parts) >= 2:
        return '/'.join(parts[:2])  # ex: main/ipc, renderer/user
    return parts[0]

def _safe_id(rel_path):
    """Gera um ID seguro para Mermaid (prefixo n_ evita colisão com subgraph IDs)."""
    return 'n_' + _short_name(rel_path).replace('/', '_').replace('-', '_').replace('.', '_')

def _safe_layer_id(layer):
    """Gera ID seguro para subgraph Mermaid."""
    return 'sg_' + layer.replace('/', '_').replace('-', '_').replace('.', '_')

def generate_mermaid_diagram(nodes, edges):
    """Gera bloco Mermaid graph LR com subgraphs por camada (detalhado)."""
    layers = {}
    for node in nodes:
        layer = _layer_key(node)
        layers.setdefault(layer, []).append(node)

    lines = ['```mermaid', 'graph LR']

    for layer in sorted(layers.keys()):
        layer_nodes = sorted(layers[layer])
        lines.append(f'  subgraph {_safe_layer_id(layer)}["{layer}"]')
        for node in layer_nodes:
            sid = _safe_id(node)
            short = _short_name(node).split('/')[-1]
            lines.append(f'    {sid}["{short}"]')
        lines.append('  end')

    seen = set()
    for src, tgt in edges:
        pair = (src, tgt)
        if pair in seen:
            continue
        seen.add(pair)
        lines.append(f'  {_safe_id(src)} --> {_safe_id(tgt)}')

    lines.append('```')
    return '\n'.join(lines)

def generate_highlevel_diagram(nodes, edges):
    """Gera diagrama Mermaid high-level (apenas camadas, sem arquivos individuais)."""
    layer_edges = set()
    for src, tgt in edges:
        src_layer = _layer_key(src)
        tgt_layer = _layer_key(tgt)
        if src_layer != tgt_layer:
            layer_edges.add((src_layer, tgt_layer))

    layers = set()
    for node in nodes:
        layers.add(_layer_key(node))

    lines = ['```mermaid', 'graph LR']
    for layer in sorted(layers):
        sid = _safe_layer_id(layer)
        lines.append(f'  {sid}["{layer}"]')
    for src_l, tgt_l in sorted(layer_edges):
        lines.append(f'  {_safe_layer_id(src_l)} --> {_safe_layer_id(tgt_l)}')
    lines.append('```')
    return '\n'.join(lines)

def generate_layer_diagram(layer_name, layer_nodes, edges):
    """Gera diagrama Mermaid para uma camada específica."""
    layer_set = set(layer_nodes)
    relevant_edges = [(s, t) for s, t in edges if s in layer_set or t in layer_set]
    if not relevant_edges:
        return None

    all_nodes = set(layer_nodes)
    for s, t in relevant_edges:
        all_nodes.add(s)
        all_nodes.add(t)

    lines = ['```mermaid', 'graph LR']

    # Nós internos da camada
    for node in sorted(layer_nodes):
        sid = _safe_id(node)
        short = _short_name(node).split('/')[-1]
        lines.append(f'  {sid}["{short}"]')

    # Nós externos (de outras camadas)
    external = sorted(all_nodes - layer_set)
    if external:
        lines.append(f'  subgraph {_safe_layer_id("external")}["external"]')
        for node in external:
            sid = _safe_id(node)
            short = _short_name(node)
            lines.append(f'    {sid}["{short}"]:::ext')
        lines.append('  end')

    seen = set()
    for src, tgt in relevant_edges:
        pair = (src, tgt)
        if pair in seen:
            continue
        seen.add(pair)
        lines.append(f'  {_safe_id(src)} --> {_safe_id(tgt)}')

    lines.append('  classDef ext fill:#555,stroke:#888,color:#ccc')
    lines.append('```')
    return '\n'.join(lines)

# ── Map Mode ──────────────────────────────────────────────────────────


def extract_detailed_exports(file_path):
    """Extrai exports com assinaturas completas incluindo return types e re-exports."""
    content = _safe_read_text(file_path)
    if content is None:
        return []

    symbols = []

    # Functions com return type
    for m in MAP_EXPORT_FUNC_RE.finditer(content):
        name = m.group(1)
        generics = (m.group(2) or '').strip()
        params = m.group(3).strip()
        ret = (m.group(4) or '').strip()
        sig = f'{name}{generics}({params})'
        if ret:
            sig += f': {ret}'
        symbols.append({'kind': 'fn', 'name': name, 'signature': sig, 'exported': True})

    # Classes
    for m in EXPORT_CLASS_RE.finditer(content):
        symbols.append({'kind': 'class', 'name': m.group(1), 'signature': m.group(1), 'exported': True})

    # Consts com tipo
    for m in MAP_EXPORT_CONST_RE.finditer(content):
        name = m.group(1)
        typ = (m.group(2) or '').strip()
        sig = f'{name}: {typ}' if typ else name
        symbols.append({'kind': 'const', 'name': name, 'signature': sig, 'exported': True})

    # Types/Interfaces com preview
    for m in MAP_EXPORT_TYPE_RE.finditer(content):
        name = m.group(1)
        body = m.group(2).strip()[:TYPE_BODY_PREVIEW_LEN] if m.group(2) else ''
        symbols.append({'kind': 'type', 'name': name, 'signature': f'{name} {{ {body}... }}' if body else name, 'exported': True})

    # Re-exports: export { A, B } from './path'
    for m in EXPORT_NAMED_FROM_RE.finditer(content):
        names = [n.strip().split(' as ') for n in m.group(1).split(',')]
        source = m.group(2)
        for parts in names:
            original = parts[0].strip()
            alias = parts[1].strip() if len(parts) > 1 else None
            if original:
                sig = f'{alias} (re-export from {source})' if alias else f'{original} (re-export from {source})'
                symbols.append({'kind': 're-export', 'name': alias or original, 'signature': sig, 'exported': True})

    # export * from './path'
    for m in EXPORT_STAR_RE.finditer(content):
        source = m.group(1)
        symbols.append({'kind': 're-export', 'name': f'* from {source}', 'signature': f'* from {source}', 'exported': True})

    # Default exports
    for m in EXPORT_DEFAULT_RE.finditer(content):
        name = m.group(1)
        if not any(s['name'] == name for s in symbols):
            symbols.append({'kind': 'default', 'name': name, 'signature': name, 'exported': True})

    return symbols


def extract_internals(file_path):
    """Extrai funções e variáveis internas (não exportadas)."""
    content = _safe_read_text(file_path)
    if content is None:
        return []

    symbols = []
    exported_names = set()

    # Coleta nomes exportados primeiro pra filtrar
    for m in EXPORT_FUNC_RE.finditer(content):
        exported_names.add(m.group(1))
    for m in MAP_EXPORT_CONST_RE.finditer(content):
        exported_names.add(m.group(1))
    for m in EXPORT_CLASS_RE.finditer(content):
        exported_names.add(m.group(1))

    # Funções internas
    for m in INTERNAL_FUNC_RE.finditer(content):
        name = m.group(1)
        if name not in exported_names:
            generics = (m.group(2) or '').strip()
            params = m.group(3).strip()
            ret = (m.group(4) or '').strip()
            sig = f'{name}{generics}({params})'
            if ret:
                sig += f': {ret}'
            symbols.append({'kind': 'fn', 'name': name, 'signature': sig, 'exported': False})

    # Variáveis internas (top-level)
    for m in INTERNAL_VAR_RE.finditer(content):
        name = m.group(1)
        if name not in exported_names and not name.startswith('_'):
            typ = (m.group(2) or '').strip()
            sig = f'{name}: {typ}' if typ else name
            symbols.append({'kind': 'const', 'name': name, 'signature': sig, 'exported': False})

    return symbols


def _cached_extract(extract_fn, cache_key, file_path, root_dir):
    """Generic cache-aware wrapper for symbol extraction functions.

    Uses SHA256 of file content to skip re-parsing unchanged files.
    Falls back to direct extraction if cache is not initialized.

    Args:
        extract_fn: The extraction function to call (e.g. extract_detailed_exports).
        cache_key: Cache key string (e.g. 'exports', 'internals').
        file_path: Path to the file to extract from.
        root_dir: Project root for relative path computation.
    """
    if _symbol_cache is None:
        return extract_fn(file_path)

    rel = file_path.relative_to(root_dir).as_posix()
    content_hash = file_content_hash(file_path)
    if content_hash is None:
        return extract_fn(file_path)

    cached = _symbol_cache.get(rel, content_hash, cache_key)
    if cached is not None:
        _symbol_cache.record_hit()
        return cached

    _symbol_cache.record_miss()
    result = extract_fn(file_path)
    _symbol_cache.put(rel, content_hash, cache_key, result)
    return result


def cached_extract_detailed_exports(file_path, root_dir):
    """Cache-aware wrapper around extract_detailed_exports()."""
    return _cached_extract(extract_detailed_exports, 'exports', file_path, root_dir)


def cached_extract_internals(file_path, root_dir):
    """Cache-aware wrapper around extract_internals()."""
    return _cached_extract(extract_internals, 'internals', file_path, root_dir)


def build_symbol_cross_ref(files, root_dir):
    """Constrói cross-reference: para cada símbolo exportado, quem o importa (por resolved path)."""
    # 1. Coleta todos os exports por arquivo: set de (name, file)
    export_keys = set()
    for f in files:
        rel = f.relative_to(root_dir).as_posix()
        exports = cached_extract_detailed_exports(f, root_dir)
        for sym in exports:
            export_keys.add((sym['name'], rel))

    # 2. Para cada import, resolve o source file e faz match exato
    usage_map = {}  # (symbol, source_file) -> list of consumer files
    for f in files:
        consumer = f.relative_to(root_dir).as_posix()
        imports = parse_named_imports(f, root_dir)
        for imp in imports:
            resolved = imp.get('resolved')
            if not resolved:
                continue
            name = imp['name']
            key = (name, resolved)
            if key in export_keys:
                usage_map.setdefault(key, []).append(consumer)

    return usage_map


# ── Skeleton Mode (P2.1) ─────────────────────────────────────────────

def generate_skeleton_export(root_dir, out_dir, target_paths, suffix="", commit_hash=None):
    """Generates skeleton view: imports + function/class signatures only, no body."""
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    files = collect_files(root_dir, target_paths, extensions=IMPORT_EXTENSIONS)

    if not files:
        log.warning("⚠️ No TS/TSX files found for skeleton.")
        return None

    log.info(f"🦴 Generating skeleton for {len(files)} files...")

    commit_str = f' | **Commit:** `{commit_hash}`' if commit_hash else ''
    lines = [
        '# Skeleton View\n',
        f'**Root:** `{root_dir.name}` | **Generated:** {timestamp}{commit_str}\n',
        f'**Files:** {len(files)} | **Content:** imports + signatures only (no function bodies)\n',
        '---\n',
    ]

    for f in sorted(files, key=lambda p: p.relative_to(root_dir).as_posix()):
        rel = f.relative_to(root_dir).as_posix()
        short = _short_name(rel)

        # Imports
        imports = parse_named_imports(f, root_dir)
        # Exports
        exports = cached_extract_detailed_exports(f, root_dir)
        # Internals
        internals = cached_extract_internals(f, root_dir)

        if not imports and not exports and not internals:
            continue

        lines.append(f'## `{short}`\n')

        if imports:
            by_source = {}
            for imp in imports:
                by_source.setdefault(imp['source'], []).append(imp)
            for source, imps in sorted(by_source.items()):
                names = ', '.join(imp['name'] for imp in imps)
                lines.append(f'import {{ {names} }} from "{source}"')
            lines.append('')

        if exports:
            for sym in exports:
                lines.append(f'export [{sym["kind"]}] {sym["signature"]}')
            lines.append('')

        if internals:
            for sym in internals[:MAX_SKELETON_INTERNALS]:
                lines.append(f'[{sym["kind"]}] {sym["signature"]}')
            if len(internals) > MAX_SKELETON_INTERNALS:
                lines.append(f'... +{len(internals) - MAX_SKELETON_INTERNALS} more')
            lines.append('')

        lines.append('---\n')

    out_file = out_dir / f'PROJECT_SKELETON{suffix}.md'
    out_file.write_text('\n'.join(lines), encoding=ENC)

    log.info(f'\n🦴 Skeleton Exported: {out_file}')
    log.info(f'   📦 {len(files)} files')

    generate_manifest(root_dir, out_dir, 'skeleton', files, commit_hash=commit_hash)

    return out_file


# ── Changes Patch Mode (P2.3) ────────────────────────────────────────

def generate_changes_patch(root_dir, out_dir, git_ref, suffix="", commit_hash=None):
    """Generates CHANGES.patch from git diff since a given ref."""
    import subprocess

    log.info(f"📝 Generating changes since {git_ref}...")

    stat_output = ''
    diff_output = ''
    changed_files = []

    try:
        # Get the diff
        result = subprocess.run(
            ['git', 'diff', git_ref, '--stat'],
            cwd=root_dir, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=30
        )
        stat_output = result.stdout.strip() if result.returncode == 0 else ''

        result = subprocess.run(
            ['git', 'diff', git_ref],
            cwd=root_dir, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=60
        )
        if result.returncode != 0:
            log.warning(f"⚠️ git diff failed: {result.stderr.strip()}")
            return None
        diff_output = result.stdout

        # Get list of changed files
        result = subprocess.run(
            ['git', 'diff', git_ref, '--name-only'],
            cwd=root_dir, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=15
        )
        changed_files = [f.strip() for f in result.stdout.strip().splitlines() if f.strip()]

    except Exception as e:
        log.warning(f"⚠️ git diff error: {e}")
        return None

    if not diff_output.strip():
        log.info("✅ No changes since the given ref.")
        return None

    from datetime import datetime
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    commit_str = f' | **Commit:** `{commit_hash}`' if commit_hash else ''

    lines = [
        '# Changes Patch\n',
        f'**Root:** `{root_dir.name}` | **Generated:** {timestamp}{commit_str}\n',
        f'**Since:** `{git_ref}` | **Changed files:** {len(changed_files)}\n',
        '---\n',
    ]

    if stat_output:
        lines.append('## Diff Stats\n')
        lines.append(f'```\n{stat_output}\n```\n')

    lines.append('## Changed Files\n')
    for cf in sorted(changed_files):
        lines.append(f'- `{cf}`')
    lines.append('\n---\n')

    lines.append('## Full Diff\n')
    lines.append(f'```diff\n{diff_output}\n```\n')

    out_file = out_dir / f'CHANGES{suffix}.md'
    out_file.write_text('\n'.join(lines), encoding=ENC)

    log.info(f'\n📝 Changes Exported: {out_file}')
    log.info(f'   📦 {len(changed_files)} files changed')

    return out_file


# ── Prompt Pack Mode (P2.4) ──────────────────────────────────────────

def generate_prompt_pack(root_dir, out_dir, target_paths, suffix="", commit_hash=None):
    """Generates a structured prompt pack with XML tags combining map + manifest."""
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    log.info("📦 Generating prompt pack...")

    # Generate skeleton inline
    skeleton_lines = []
    files = collect_files(root_dir, target_paths, extensions=IMPORT_EXTENSIONS)

    if not files:
        log.warning("⚠️ No TS/TSX files found.")
        return None

    # Build repo map inline
    repo_map = build_repo_map(files, root_dir)
    map_lines = []
    for rel_path in sorted(repo_map.keys()):
        symbols = repo_map[rel_path]
        short = _short_name(rel_path)
        sigs = [sig for _, sig in symbols]
        map_lines.append(f'{short}: {", ".join(sigs)}')

    # Build manifest data
    manifest_entries = []
    for f in sorted(files, key=lambda p: p.relative_to(root_dir).as_posix()):
        rel = f.relative_to(root_dir).as_posix()
        try:
            size = f.stat().st_size
        except Exception:
            size = 0
        manifest_entries.append(f'  {rel} ({size}B)')

    commit_str = f'  commit: {commit_hash}\n' if commit_hash else ''
    pack = f"""<background_information>
  <metadata>
    root: {root_dir.name}
    generated: {timestamp}
{commit_str}    files: {len(files)}
    estimated_tokens: ~{estimate_tokens(sum(f.stat().st_size for f in files)):,}
  </metadata>

  <repo_map>
{chr(10).join(map_lines)}
  </repo_map>

  <file_index>
{chr(10).join(manifest_entries)}
  </file_index>
</background_information>

<task>
  OBJECTIVE: [describe your task here]
  CONSTRAINTS: [any constraints]
  OUTPUT: [desired output format]
</task>
"""

    out_file = out_dir / f'PROMPT_PACK{suffix}.md'
    out_file.write_text(pack, encoding=ENC)

    log.info(f'\n📦 Prompt Pack Exported: {out_file}')
    log.info(f'   📦 {len(files)} files, {len(repo_map)} with exports')

    generate_manifest(root_dir, out_dir, 'pack', files, commit_hash=commit_hash)

    return out_file


def generate_map_export(root_dir, out_dir, target_paths, suffix="", doc_label="project", commit_hash=None):
    """Gera mapa completo de símbolos com imports, exports, internals e cross-ref."""
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Coleta arquivos
    files = collect_files(root_dir, target_paths, extensions=IMPORT_EXTENSIONS)

    if not files:
        log.warning("⚠️ Nenhum arquivo TS/TSX encontrado.")
        return None

    log.info(f"🗺️  Analisando {len(files)} arquivos em modo Map...")

    # Cross-reference global
    log.info(f"   🔗 Construindo cross-reference de símbolos...")
    usage_map = build_symbol_cross_ref(files, root_dir)

    # Dependency graph (reusa do doc)
    nodes, edges = build_dependency_graph(files, root_dir)
    unique_edges = list(dict.fromkeys(edges))


    # Agrupa por camada
    layers = {}
    for f in files:
        rel = f.relative_to(root_dir).as_posix()
        layer = _layer_key(rel)
        layers.setdefault(layer, []).append(f)

    commit_str = f' | **Commit:** `{commit_hash}`' if commit_hash else ''
    lines = [
        f'# Symbol Map — {doc_label}\n',
        f'**Root:** `{root_dir.name}` | **Generated:** {timestamp}{commit_str}\n',
        f'**Files:** {len(files)} | **Dependencies:** {len(unique_edges)}\n',
        '**Limitations:** regex-based — does not capture dynamic `import()`, complex barrel indexes, or conditional exports.\n',
        '---\n',
    ]

    # ═══════════════════════════════════════════════════════
    # Summary: Top symbols by usage
    # ═══════════════════════════════════════════════════════
    symbol_usage_count = {}
    for (sym_name, provider), consumers in usage_map.items():
        key = f'`{sym_name}` ← `{_short_name(provider)}`'
        symbol_usage_count[key] = len(set(consumers))

    if symbol_usage_count:
        lines.append('## Most Used Symbols\n')
        lines.append('| Symbol ← Provider | Used By (files) |')
        lines.append('|-------------------|----------------:|')
        for sym, count in sorted(symbol_usage_count.items(), key=lambda x: x[1], reverse=True)[:20]:
            lines.append(f'| {sym} | {count} |')
        lines.append('')

    # ═══════════════════════════════════════════════════════
    # Per-file detailed analysis
    # ═══════════════════════════════════════════════════════
    lines.append('---\n')
    lines.append('## Per-File Symbol Map\n')

    for layer in sorted(layers.keys()):
        layer_files = sorted(layers[layer], key=lambda f: f.relative_to(root_dir).as_posix())
        lines.append(f'### {layer}\n')

        for f in layer_files:
            rel = f.relative_to(root_dir).as_posix()
            short = _short_name(rel)
            lines.append(f'#### `{short}`\n')

            # — IMPORTS —
            imports = parse_named_imports(f, root_dir)
            if imports:
                # Agrupa por source
                by_source = {}
                for imp in imports:
                    by_source.setdefault(imp['source'], []).append(imp)

                lines.append('**Imports:**\n')
                for source, imps in sorted(by_source.items()):
                    names = []
                    for imp in imps:
                        if imp['alias']:
                            names.append(f"`{imp['name']}` as `{imp['alias']}`")
                        elif imp['kind'] == 'namespace':
                            names.append(f"`{imp['name']}`")
                        elif imp['kind'] == 'default':
                            names.append(f"**default** `{imp['name']}`")
                        else:
                            names.append(f"`{imp['name']}`")
                    lines.append(f'- `{source}` → {" · ".join(names)}')
                lines.append('')

            # — EXPORTS —
            exports = cached_extract_detailed_exports(f, root_dir)
            if exports:
                lines.append('**Exports:**\n')
                lines.append('| Kind | Signature | Used By |')
                lines.append('|------|-----------|--------:|')
                for sym in exports:
                    # Cross-ref: quem usa este símbolo
                    key = (sym['name'], rel)
                    consumers = usage_map.get(key, [])
                    used_count = len(set(consumers))
                    used_str = f'{used_count} files' if used_count > 0 else '—'
                    sig = sym['signature'].replace('|', '∣')
                    lines.append(f'| {sym["kind"]} | `{sig}` | {used_str} |')
                lines.append('')

            # — INTERNALS —
            internals = cached_extract_internals(f, root_dir)
            if internals:
                lines.append('**Internal:**\n')
                for sym in internals[:MAX_INTERNALS_DISPLAY]:
                    lines.append(f'- [{sym["kind"]}] `{sym["signature"]}`')
                if len(internals) > MAX_INTERNALS_DISPLAY:
                    lines.append(f'- *... +{len(internals) - MAX_INTERNALS_DISPLAY} more*')
                lines.append('')

            # — DEPENDENCIES (quem este arquivo importa) —
            file_edges = [(s, t) for s, t in unique_edges if s == rel]
            if file_edges:
                lines.append('**Depends on:**\n')
                for _, tgt in sorted(file_edges, key=lambda x: x[1]):
                    lines.append(f'- `{_short_name(tgt)}`')
                lines.append('')

            # — USED BY (quem importa este arquivo) —
            imported_by = [(s, t) for s, t in unique_edges if t == rel]
            if imported_by:
                lines.append('**Used by:**\n')
                for src, _ in sorted(imported_by, key=lambda x: x[0]):
                    lines.append(f'- `{_short_name(src)}`')
                lines.append('')

            lines.append('---\n')

    # Salva
    out_file = out_dir / f'PROJECT_MAP{suffix}.md'
    out_file.write_text('\n'.join(lines), encoding=ENC)

    total_exports = sum(len(cached_extract_detailed_exports(f, root_dir)) for f in files)
    total_cross = sum(len(v) for v in usage_map.values())

    log.info(f'\n🗺️  Map Exported: {out_file}')
    log.info(f'   📦 {len(files)} files, {total_exports} exports, {total_cross} cross-refs')

    # P1.1: Generate MANIFEST.json
    generate_manifest(root_dir, out_dir, 'map', files, commit_hash=commit_hash)

    return out_file


def generate_doc_export(root_dir, out_dir, target_paths, suffix="", full=False, doc_label="project", ai_mode=True, commit_hash=None):
    """Gera documentação com diagramas Mermaid, RepoMap, Behavior Maps e ranking."""
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Coleta arquivos TS/TSX
    files = collect_files(root_dir, target_paths, extensions=IMPORT_EXTENSIONS)

    if not files:
        log.warning("⚠️ Nenhum arquivo TS/TSX encontrado para documentar.")
        return None

    log.info(f"📊 Analisando {len(files)} arquivos...")
    nodes, edges = build_dependency_graph(files, root_dir)
    unique_edges = list(dict.fromkeys(edges))
    log.info(f"   🔗 {len(unique_edges)} dependências internas")

    # RepoMap
    log.info(f"   📋 Extraindo símbolos exportados...")
    repo_map = build_repo_map(files, root_dir)

    # Behavior Maps
    log.info(f"   ⚡ Extraindo IPC channels e preload bridge...")
    ipc_channels = extract_ipc_channels(files, root_dir)
    preload_bridges = extract_preload_bridge(files, root_dir)

    # Graph stats
    stats = compute_graph_stats(nodes, unique_edges)

    # Agrupa por camada
    layers = {}
    for node in nodes:
        layer = _layer_key(node)
        layers.setdefault(layer, []).append(node)

    edge_map = {}
    for src, tgt in unique_edges:
        edge_map.setdefault(src, set()).add(tgt)

    # ═══════════════════════════════════════════════════════
    # Flow Narratives
    # ═══════════════════════════════════════════════════════
    flow_narratives = generate_flow_narratives(ipc_channels, edge_map)

    commit_str = f' | **Commit:** `{commit_hash}`' if commit_hash else ''
    lines = [
        '# Project Documentation\n',
        f'**Root:** `{root_dir.name}` | **Generated:** {timestamp}{commit_str}\n',
        f'**Files:** {len(files)} | **Notation:** `A --> B` = A imports B (static dependency, regex-based).\n',
        '**Limitations:** does not capture dynamic `import()`, `export * from`, re-exports, barrel indexes, tsconfig path aliases, or bundler-resolved imports.\n',
    ]

    lines.extend([
        '---\n',
        '## Architecture Layers\n',
        generate_highlevel_diagram(nodes, unique_edges),
        '',
    ])

    # Top Hubs
    lines.append('---\n')
    lines.append('## Top Hubs\n')
    lines.append('| # | Module | In | Out | Total |')
    lines.append('|---|--------|---:|----:|------:|')
    for i, (node, total) in enumerate(stats['top_hubs'], 1):
        ind = stats['in_deg'].get(node, 0)
        outd = stats['out_deg'].get(node, 0)
        lines.append(f'| {i} | `{_short_name(node)}` | {ind} | {outd} | {total} |')
    lines.append('')

    # Most Imported
    lines.append('### Most Imported\n')
    lines.append('| Module | Imported By |')
    lines.append('|--------|----------:|')
    for node, count in stats['top_imported']:
        if count > 0:
            lines.append(f'| `{_short_name(node)}` | {count} |')
    lines.append('')

    # Cycles
    if stats['cycles']:
        lines.append('### Circular Dependencies\n')
        for cycle in stats['cycles']:
            lines.append(f'- `{" → ".join(cycle)}`')
        lines.append('')
    else:
        lines.append('### No Circular Dependencies Detected\n')

    # ═══════════════════════════════════════════════════════
    # Behavior Maps (IPC + Preload)
    # ═══════════════════════════════════════════════════════
    if ipc_channels:
        lines.append('---\n')
        lines.append('## IPC Channel Map\n')
        lines.append('| Channel | Handler | Request Type |')
        lines.append('|---------|---------|-------------|')
        for ch in ipc_channels:
            lines.append(f'| `{ch["channel"]}` | `{ch["handler"]}` | `{ch["request"]}` |')
        lines.append('')

    if preload_bridges:
        lines.append('---\n')
        lines.append('## Preload Bridge\n')
        for bridge in preload_bridges:
            lines.append(f'**`window.{bridge["api"]}`** (from `{bridge["file"]}`)')
            lines.append('')
            if bridge['channels']:
                lines.append('| IPC Channel |')
                lines.append('|-------------|')
                for ch in bridge['channels']:
                    lines.append(f'| `{ch}` |')
                lines.append('')

    # ═══════════════════════════════════════════════════════
    # (D) Flow Narratives
    # ═══════════════════════════════════════════════════════
    if flow_narratives:
        lines.append('---\n')
        lines.append('## Critical Flows\n')
        for flow in flow_narratives:
            ch_list = ', '.join(f'`{c}`' for c in flow['channels'][:5])
            extra = f' (+{len(flow["channels"]) - 5} more)' if len(flow['channels']) > 5 else ''
            lines.append(f'**{flow["handler"]}** — {ch_list}{extra}\n')
            if flow['direct']:
                lines.append(f'  → {" → ".join(flow["direct"])}')
            if flow['deep']:
                lines.append(f'  →→ {" · ".join(flow["deep"])}')
            lines.append('')

    # Modules by Layer table
    lines.append('---\n')
    lines.append('## Modules by Layer\n')
    lines.append('| Layer | Files |')
    lines.append('|-------|------:|')
    for layer in sorted(layers.keys()):
        lines.append(f'| `{layer}` | {len(layers[layer])} |')
    lines.append('')

    # ═══════════════════════════════════════════════════════
    # L2: Per-layer details + RepoMap
    # ═══════════════════════════════════════════════════════
    lines.append('---\n')
    lines.append('## Per-Layer Details\n')

    for layer in sorted(layers.keys()):
        layer_nodes = layers[layer]
        lines.append(f'### {layer}\n')

        # (C) Diagrama per-layer só no modo human
        if not ai_mode:
            diagram = generate_layer_diagram(layer, layer_nodes, unique_edges)
            if diagram:
                lines.append(diagram)
                lines.append('')

        # RepoMap por arquivo desta camada
        has_symbols = False
        for node in sorted(layer_nodes):
            symbols = repo_map.get(node, [])
            if symbols:
                if not has_symbols:
                    lines.append('**Exported Symbols:**\n')
                    has_symbols = True
                short = _short_name(node).split('/')[-1]
                sym_parts = []
                for kind, sig in symbols:
                    if kind == 'fn':
                        sym_parts.append(f'`{sig}`')
                    elif kind == 'class':
                        sym_parts.append(f'**class** `{sig}`')
                    elif kind == 'type':
                        sym_parts.append(f'*type* `{sig}`')
                    elif kind == 'const':
                        sym_parts.append(f'`{sig}`')
                    elif kind == 'default':
                        sym_parts.append(f'default `{sig}`')
                lines.append(f'- **{short}**: {" · ".join(sym_parts)}')

        if has_symbols:
            lines.append('')

        # Dependências
        lines.append('**Dependencies:**\n')
        for node in sorted(layer_nodes):
            short = _short_name(node)
            deps = edge_map.get(node, set())
            dep_str = ', '.join(f'`{_short_name(d)}`' for d in sorted(deps)) if deps else '—'
            lines.append(f'- `{short}` → {dep_str}')
        lines.append('')

    # ═══════════════════════════════════════════════════════
    # L3: Full graph (only with --doc-full)
    # ═══════════════════════════════════════════════════════
    if full:
        lines.append('---\n')
        lines.append('## Full Dependency Graph\n')
        lines.append(generate_mermaid_diagram(nodes, unique_edges))
        lines.append('')

    # Salva
    out_file = out_dir / f'PROJECT_DOC{suffix}.md'
    out_file.write_text('\n'.join(lines), encoding=ENC)

    log.info(f'\n📐 Doc Exported: {out_file}')
    log.info(f'   📦 {len(nodes)} modules, {len(unique_edges)} deps, {len(repo_map)} with exports')
    if ipc_channels:
        log.info(f'   ⚡ {len(ipc_channels)} IPC channels mapped')
    if stats["cycles"]:
        log.warning(f'   ⚠️  {len(stats["cycles"])} circular dependencies found')

    # P1.1: Generate MANIFEST.json
    generate_manifest(root_dir, out_dir, 'doc', files, commit_hash=commit_hash)

    return out_file

def main():
    parser = argparse.ArgumentParser(description="Exporta código do projeto para análise de IA.")
    parser.add_argument("--root", default=".", help="Diretório raiz do projeto")
    parser.add_argument("--out", default="export", help="Diretório de saída")
    parser.add_argument("--path", default=None, help="Sub-pasta ou arquivos (sep. por vírgula)")
    parser.add_argument("--diff", action="store_true", help="Apenas modificados")
    parser.add_argument("--tree", action="store_true", help="Exporta apenas hierarquia de pastas/arquivos")
    parser.add_argument("--doc", action="store_true", help="Gera doc AI-optimized (tabelas, sem Mermaid per-layer)")
    parser.add_argument("--doc-human", action="store_true", help="Gera doc com Mermaid completo (per-layer diagrams)")
    parser.add_argument("--doc-full", action="store_true", help="Inclui Full Dependency Graph (L3)")
    parser.add_argument("--map", action="store_true", help="Deep symbol map: imports nomeados, exports, internals, cross-ref")
    parser.add_argument("--ignore", default=None, help="Patterns extras para ignorar (separados por vírgula)")
    parser.add_argument("--no-gitignore", action="store_true", help="Desativa leitura de .gitignore")
    parser.add_argument("--pretty-json", action="store_true", help="Pretty-print JSON minificado")
    parser.add_argument("--max-files", type=int, default=None, help="Max number of files to include (by size, smallest first)")
    parser.add_argument("--max-bytes-per-file", type=int, default=None, help="Skip files larger than N bytes")
    parser.add_argument("--skeleton", action="store_true", help="Export imports + signatures only (no function bodies)")
    parser.add_argument("--since", default=None, help="Git ref to diff against (e.g. HEAD~5, main, abc1234)")
    parser.add_argument("--pack", action="store_true", help="Generate structured prompt pack with XML tags")
    parser.add_argument("--budget-tokens", type=int, default=None, help="Max estimated tokens; selects files by priority")
    parser.add_argument("--log-json", action="store_true", help="Output logs as JSONL (machine-readable) instead of decorative text")

    # Flags de Presets
    for preset in PRESETS:
        parser.add_argument(f"--{preset}", action="store_true", help=f"Exporta preset: {preset}")

    args = parser.parse_args()

    # P3.1: Reconfigure logger based on --log-json flag
    global log
    log = setup_logging(json_mode=args.log_json)

    project_root = Path(args.root).resolve()
    if project_root.name == "scripts":
        project_root = project_root.parent

    # Initialize config from CLI args — replaces scattered global statements
    global _config
    _config = ExportConfig(
        gitignore_spec=load_gitignore_spec(project_root) if not args.no_gitignore else None,
        extra_ignores=[p.strip() for p in args.ignore.split(',') if p.strip()] if args.ignore else [],
        pretty_json_mode=args.pretty_json,
    )

    # P3.2: Initialize symbol cache for incremental extraction
    global _symbol_cache
    _symbol_cache = SymbolCache(project_root)

    out_dir = project_root / args.out
    out_dir.mkdir(parents=True, exist_ok=True)

    # P1.5: Detect git commit hash for artifact headers
    commit_hash = get_git_commit_hash(project_root)

    # Build filters dict for manifest
    active_filters = {}
    if args.ignore:
        active_filters['ignore'] = args.ignore
    if args.path:
        active_filters['path'] = args.path
    if getattr(args, 'max_files', None):
        active_filters['max_files'] = args.max_files
    if getattr(args, 'max_bytes_per_file', None):
        active_filters['max_bytes_per_file'] = args.max_bytes_per_file

    target_paths = []
    
    # Verifica Presets Primeiro
    preset_active = False
    for preset, paths in PRESETS.items():
        if getattr(args, preset):
            for path_str in paths:
                tp = (project_root / path_str).resolve()
                if tp.exists():
                    target_paths.append(tp)
                else:
                    log.warning(f"⚠️ Aviso: O caminho '{path_str}' não existe")
            preset_active = True
            if not args.path: args.path = preset

    if not preset_active:
        if args.path:
            path_strs = args.path.split(',')
            for p_str in path_strs:
                p_str = p_str.strip()
                tp = (project_root / p_str).resolve()
                if tp.exists():
                    target_paths.append(tp)
        else:
            target_paths = [project_root]

    # Sufixo para nome de arquivo
    file_suffix = ""
    if args.path:
        clean_path = args.path.replace('/', '_').replace('\\', '_')
        if len(clean_path) > MAX_PATH_SUFFIX_LEN:
            clean_path = hashlib.md5(clean_path.encode()).hexdigest()
        file_suffix = f"_{clean_path}"

    # MODO SKELETON: imports + signatures only (P2.1)
    if args.skeleton:
        log.info(f"🦴 Modo Skeleton — imports + assinaturas")
        log.info(f"📂 Raiz do projeto: {project_root}")
        log.info(f"📂 Saída em: {out_dir}")

        output_file = generate_skeleton_export(project_root, out_dir, target_paths, file_suffix, commit_hash=commit_hash)

        if output_file:
            print_token_stats(output_file)
            copy_to_clipboard(output_file.read_text(encoding=ENC))

        _symbol_cache.save()
        return

    # MODO SINCE: git diff based export (P2.3)
    if args.since:
        log.info(f"📝 Modo Since — diff contra {args.since}")
        log.info(f"📂 Raiz do projeto: {project_root}")
        log.info(f"📂 Saída em: {out_dir}")

        output_file = generate_changes_patch(project_root, out_dir, args.since, file_suffix, commit_hash=commit_hash)

        if output_file:
            print_token_stats(output_file)
            copy_to_clipboard(output_file.read_text(encoding=ENC))

        return

    # MODO PACK: structured prompt pack (P2.4)
    if args.pack:
        log.info(f"📦 Modo Pack — prompt pack estruturado")
        log.info(f"📂 Raiz do projeto: {project_root}")
        log.info(f"📂 Saída em: {out_dir}")

        output_file = generate_prompt_pack(project_root, out_dir, target_paths, file_suffix, commit_hash=commit_hash)

        if output_file:
            print_token_stats(output_file)
            copy_to_clipboard(output_file.read_text(encoding=ENC))

        _symbol_cache.save()
        return

    # MODO MAP: Deep symbol map
    if args.map:
        doc_label = "project"
        for preset in PRESETS:
            if getattr(args, preset):
                doc_label = preset
                break
        log.info(f"🗺️  Modo Map — {doc_label}")
        log.info(f"📂 Raiz do projeto: {project_root}")
        log.info(f"📂 Saída em: {out_dir}")

        output_file = generate_map_export(project_root, out_dir, target_paths, file_suffix, doc_label=doc_label, commit_hash=commit_hash)

        if output_file:
            print_token_stats(output_file)
            copy_to_clipboard(output_file.read_text(encoding=ENC))

        _symbol_cache.save()
        return

    # MODO DOC: Gera documentação com diagramas Mermaid
    if args.doc or args.doc_human or args.doc_full:
        is_full = args.doc_full
        ai_mode = not args.doc_human  # --doc e --doc-full = AI mode; --doc-human = human mode
        mode_str = 'AI' if ai_mode else 'HUMAN'
        # Detecta label do doc baseado no preset ativo
        doc_label = "project"
        for preset in PRESETS:
            if getattr(args, preset):
                doc_label = preset
                break
        log.info(f"📐 Modo Doc [{mode_str}]{'  +L3' if is_full else ''} — {doc_label}")
        log.info(f"📂 Raiz do projeto: {project_root}")
        log.info(f"📂 Saída em: {out_dir}")

        output_file = generate_doc_export(project_root, out_dir, target_paths, file_suffix, full=is_full, doc_label=doc_label, ai_mode=ai_mode, commit_hash=commit_hash)

        if output_file:
            print_token_stats(output_file)
            copy_to_clipboard(output_file.read_text(encoding=ENC))

        _symbol_cache.save()
        return

    # MODO TREE: Exporta apenas hierarquia
    if args.tree:
        log.info(f"🌳 Modo Tree Ativado - Exportando hierarquia de diretórios")
        log.info(f"📂 Raiz do projeto: {project_root}")
        log.info(f"📂 Saída em: {out_dir}")
        
        output_file = generate_tree_export(project_root, out_dir, target_paths)
        
        if output_file:
            print_token_stats(output_file)
            copy_to_clipboard(output_file.read_text(encoding=ENC))
        
        return

    # MODO NORMAL: Exporta código completo
    state_file = project_root / ".export_state.json"
    old_state = load_state(state_file)
    current_state = {}

    log.info(f"🔍 Escaneando {len(target_paths)} caminhos alvo")
    log.info(f"📂 Raiz do projeto: {project_root}")
    log.info(f"📂 Saída em: {out_dir}")

    files = collect_files(project_root, target_paths, extensions=set(DEFAULT_EXTENSIONS))

    # P1.3: Apply file size/count filters
    original_count = len(files)
    if args.max_bytes_per_file:
        files = [f for f in files if f.stat().st_size <= args.max_bytes_per_file]
        skipped = original_count - len(files)
        if skipped:
            log.warning(f"   ⚠️ Skipped {skipped} files exceeding --max-bytes-per-file {args.max_bytes_per_file}")

    # Identifica arquivos modificados e popula current_state
    modified_files = []
    for f in files:
        rel_path = str(f.relative_to(project_root).as_posix())
        mtime = f.stat().st_mtime
        current_state[rel_path] = mtime
        
        # Na primeira execução do diff (sem old_state), ou se houver mudança
        if args.diff:
            if rel_path not in old_state or old_state[rel_path] != mtime:
                modified_files.append(f)

    # Salva o novo estado (sempre atualiza para a próxima vez)
    save_state(state_file, current_state)

    # Decide o que exportar
    files_to_export = modified_files if args.diff else files

    # P1.3: Apply --max-files (sort by size ascending, keep smallest)
    excluded_by_limit = 0
    if args.max_files and len(files_to_export) > args.max_files:
        files_to_export = sorted(files_to_export, key=lambda f: f.stat().st_size)[:args.max_files]
        excluded_by_limit = len(files) - args.max_files
        log.warning(f"   ⚠️ Limited to {args.max_files} files (--max-files)")

    # P2.2: Apply --budget-tokens (select files until token budget is exhausted)
    budget_excluded = 0
    if args.budget_tokens:
        budget = args.budget_tokens
        sorted_by_size = sorted(files_to_export, key=lambda f: f.stat().st_size)
        selected = []
        running_tokens = 0
        for f in sorted_by_size:
            file_tokens = estimate_tokens(f.stat().st_size)
            if running_tokens + file_tokens > budget and selected:
                budget_excluded += 1
                continue
            selected.append(f)
            running_tokens += file_tokens
        if budget_excluded:
            log.warning(f"   ⚠️ --budget-tokens {budget}: selected {len(selected)} files (~{running_tokens:,} tokens), excluded {budget_excluded}")
        files_to_export = selected
        excluded_by_limit += budget_excluded
    
    if args.diff:
        log.info(f"✨ Modo Diferencial Ativado: {len(modified_files)} arquivos alterados detectados.")
        if not old_state:
            log.info("ℹ️ Primeira execução com --diff: Estado inicial salvo. Nas próximas vezes exportará apenas as mudanças.")
    
    log.info(f"📄 Processando {len(files_to_export)} arquivos.")
    
    blocks = []
    for f in sorted(files_to_export):
        rel_path = f.relative_to(project_root).as_posix()
        log.info(f"  READ: {rel_path}")
        block = get_code_block(f, project_root, pretty_json=_config.pretty_json_mode)
        if block:
            blocks.append(block)

    if not blocks:
        if args.diff and old_state:
            log.info("✅ Nada foi alterado desde a última execução.")
        else:
            log.warning("⚠️ Nenhum arquivo encontrado para exportar.")
        return

    # 1. Arquivo Completo
    suffix = ""
    if args.diff:
        suffix += "_DIFF"
    if args.path:
        # Remove caracteres problemáticos para o nome do arquivo
        clean_path = args.path.replace('/', '_').replace('\\', '_')
        if len(clean_path) > MAX_PATH_SUFFIX_LEN:
            clean_path = hashlib.md5(clean_path.encode()).hexdigest()
        suffix += f"_{clean_path}"
    
    full_content = "".join([b for b in blocks if b])
    full_path = out_dir / f"PROJECT_CONTEXT{suffix}.md"
    full_path.write_text(full_content, encoding=ENC)
    log.info(f"\n🎉 Arquivo Único Gerado: {full_path} ({(len(full_content.encode(ENC))/1024):.2f} KB)")
    print_token_stats(full_path)

    # P1.1: Generate MANIFEST.json
    mode_name = 'diff' if args.diff else 'full'
    generate_manifest(project_root, out_dir, mode_name, files_to_export,
                      commit_hash=commit_hash, filters=active_filters,
                      excluded_count=excluded_by_limit + (original_count - len(files)))

    # 2. Arquivos Particionados (para IAs com contexto menor)
    write_parts([b for b in blocks if b], out_dir, DEFAULT_MAX_PART_BYTES)
    
    copy_to_clipboard(full_content)

    # P3.2: Persist symbol cache
    _symbol_cache.save()

if __name__ == "__main__":
    main()
