#!/usr/bin/env python3
"""Ningún comando del agente borra lo que no se puede recuperar

    hook PreToolUse de Bash · .claude/settings.json
    python3 tools/guardia.py --prueba     ·     npm run guardia

── POR QUÉ APARECE ESTA GUARDIA ──────────────────────────────────────────────

El 2026-11-26, al limpiar después de mergear #148, el agente corrió
`git worktree remove --force` sobre **todo** worktree cuyo camino dijera
«agent-»: eran 13, y 10 venían de sesiones anteriores. Las ramas quedaron; lo
que no estuviera commiteado en esos worktrees se perdió, y **no se sabe si
había algo**, porque `--force` no avisa.

No fue un descuido de lectura: git tenía su propia protección —sin `--force`
se niega a borrar un worktree con cambios— y la bandera la apagó. **La regla
«antes de borrar, mirá» estaba escrita y no alcanzó**, igual que la del `.pen`
en septiembre. Una advertencia que no se puede comprobar no es una regla.

── QUÉ HACE ──────────────────────────────────────────────────────────────────

Lee el comando que el agente está por correr y **lo frena** —sale con 2, que
Claude Code entiende como «bloqueado» y le devuelve el motivo al agente— si
borra algo que después no se recupera:

- trabajo sin commitear (`worktree remove --force`, `reset --hard`,
  `checkout -- .`, `restore`, `clean -f`) cuando **de verdad hay** cambios;
- commits (`branch -D`, `branch -f`, `push --force` sin `--with-lease`,
  `stash drop|clear`);
- archivos que git no guarda o que son la memoria del proyecto (`rm` sobre
  `docs/`, `design/`, `contracts/`, `CLAUDE.md`, los planes, los worktrees, la
  memoria del agente).

**Donde git ya tiene su protección, la guardia sólo prohíbe apagarla**: con
`git worktree remove` sin `--force` y con `git branch -d`, git se niega solo
si se pierde algo. Por eso no hace falta mirar estado para esas dos.

**La salida es el humano**: si de verdad hay que borrar, lo corre él con
`! <comando>`, que no pasa por la guardia. El agente no tiene forma de
saltársela, y es a propósito — una guardia que el agente puede apagar es la
bandera `--force` otra vez.

**Si la guardia misma falla** (un JSON que no entiende, un error suyo), deja
pasar: una guardia rota que bloquea todo Bash es una que alguien saca.

Códigos: 0 deja pasar · 2 frena. Con `--prueba`: 0 conforme · 1 falla.
"""
# Python 3.9 en esta máquina · misma razón que en `tools/humo.py`.
from __future__ import annotations

import json
import os
import re
import shlex
import subprocess
import sys

SALIDA = "Si de verdad hay que hacerlo, que lo corra el humano con `! <comando>`."

# Lo que git no guarda, o que es la memoria del proyecto. Un `git rm` sobre
# algo versionado se recupera del historial y no pasa por acá.
PROTEGIDOS = (
    "docs",
    "design",
    "contracts",
    "CLAUDE.md",
    "plan-de-trabajo.md",
    "plan-fase-6.md",
    "nuevo-desarrollo.md",
    ".git",
    "worktrees",
    ".claude",
    "memory",
)


def limpiar(comando: str) -> str:
    """Saca el texto libre que no se ejecuta: cuerpos de heredoc y mensajes.

    Sin esto, un commit cuyo mensaje dice «no usar `reset --hard`» queda
    frenado por la guardia que lo documenta.
    """
    comando = re.sub(
        r"<<-?\s*['\"]?(\w+)['\"]?.*?\n.*?\n\s*\1\b", "", comando, flags=re.S
    )
    comando = re.sub(
        r"(?:-m|--message|--body|--title|-b)\s+(\"(?:[^\"\\]|\\.)*\"|'[^']*')",
        "",
        comando,
    )
    return comando


def tramos(comando: str) -> list[str]:
    return [t.strip() for t in re.split(r"&&|\|\||;|\||\n", comando) if t.strip()]


def palabras(tramo: str) -> list[str]:
    try:
        return shlex.split(tramo)
    except ValueError:
        return tramo.split()


def subcomando_git(ps: list[str]) -> tuple[str | None, list[str], str | None]:
    """`git -C dir worktree remove x` → ("worktree", [...], "dir")."""
    if "git" not in ps:
        return None, [], None
    i = ps.index("git") + 1
    directorio = None
    while i < len(ps) and ps[i].startswith("-"):
        if ps[i] == "-C" and i + 1 < len(ps):
            directorio = ps[i + 1]
            i += 2
        elif ps[i] in ("-c", "--git-dir", "--work-tree") and i + 1 < len(ps):
            i += 2
        else:
            i += 1
    if i >= len(ps):
        return None, [], directorio
    return ps[i], ps[i + 1 :], directorio


def con_cambios(directorio: str) -> bool | None:
    """True si hay algo sin commitear; None si no se pudo saber."""
    try:
        r = subprocess.run(
            ["git", "-C", directorio, "status", "--porcelain"],
            capture_output=True,
            text=True,
            timeout=10,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    if r.returncode != 0:
        return None
    return bool(r.stdout.strip())


def directorio_de(comando: str, tramo_dir: str | None, cwd: str) -> str:
    if tramo_dir:
        return os.path.join(cwd, os.path.expanduser(tramo_dir))
    m = re.match(r"\s*cd\s+(\"[^\"]+\"|'[^']+'|\S+)", comando)
    if m:
        return os.path.join(cwd, os.path.expanduser(m.group(1).strip("\"'")))
    return cwd


def tiene(args: list[str], *banderas: str) -> bool:
    for a in args:
        if a in banderas:
            return True
        # banderas cortas juntas: -fd, -Df
        cortas = [b[1] for b in banderas if len(b) == 2 and b[0] == "-"]
        if re.fullmatch(r"-[a-zA-Z]+", a) and any(c in a[1:] for c in cortas):
            return True
    return False


def revisar(comando: str, cwd: str) -> str | None:
    """El motivo para frenar, o None si el comando puede correr."""
    crudo = comando
    comando = limpiar(comando)
    for tramo in tramos(comando):
        ps = palabras(tramo)
        sub, args, gdir = subcomando_git(ps)

        if sub == "worktree" and args[:1] == ["remove"] and tiene(args, "--force", "-f"):
            return (
                "`git worktree remove --force` borra el trabajo sin commitear sin "
                "avisar. Sin `--force`, git se niega solo si el worktree tiene "
                "cambios: usa eso, y si se niega, mira qué hay antes de decidir."
            )

        if sub == "branch" and (
            tiene(args, "-D", "-f", "--force") or ("--delete" in args and "--force" in args)
        ):
            return (
                "`git branch -D` / `-f` puede tirar commits que no están en "
                "ninguna otra rama. `git branch -d` se niega solo si la rama no "
                "está mergeada: usa eso."
            )

        if sub == "push" and (
            tiene(args, "--force", "-f") or any(a.startswith("+") for a in args)
        ) and not any(a.startswith("--force-with-lease") for a in args):
            return (
                "`git push --force` pisa commits del remoto que acá no se ven. "
                "Usa `--force-with-lease`."
            )

        if sub == "stash" and args[:1] in (["drop"], ["clear"]):
            return "`git stash drop|clear` borra trabajo guardado que no está en ninguna rama."

        destruye_arbol = (
            (sub == "reset" and "--hard" in args)
            or (sub == "checkout" and ("--" in args or "." in args))
            or (sub == "restore" and "--staged" not in args)
            or (sub == "clean" and tiene(args, "-f", "--force"))
        )
        if destruye_arbol:
            d = directorio_de(crudo, gdir, cwd)
            sucio = con_cambios(d)
            if sucio is not False:
                cual = "hay cambios sin commitear" if sucio else "no se pudo leer su estado"
                return (
                    f"`git {sub}` descarta lo que no está commiteado, y en `{d}` "
                    f"{cual}. Commitéalo o guárdalo en una rama antes."
                )

        borra = (ps[:1] == ["rm"] or "rm" in ps[:3] and "xargs" in ps[:3]) or (
            ps[:1] == ["find"] and "-delete" in ps
        )
        if borra:
            for p in PROTEGIDOS:
                if re.search(rf"(^|[\s/\"'])({re.escape(p)})(/|\s|$|[\"'])", crudo):
                    return (
                        f"`rm` sobre `{p}`: es memoria del proyecto o algo que git "
                        "no guarda. Si está versionado, `git rm` lo deja en el "
                        "historial."
                    )
    return None


# ── la prueba de la guardia ─────────────────────────────────────────────────
# Corre en la puerta: una guardia que dejó de frenar no avisa sola.

CASOS_SIN_ESTADO = [
    # (comando, frena)
    ("git worktree remove --force .claude/worktrees/agent-1", True),
    ("git worktree list | grep agent- | awk '{print $1}' | xargs -I{} git worktree remove -f {}", True),
    ("git worktree remove .claude/worktrees/agent-1", False),
    ("git worktree prune", False),
    ("git branch -D worktree-agent-abc", True),
    ("git branch -Df x", True),
    ("git branch --delete --force x", True),
    ("git branch -f main HEAD~1", True),
    ("git branch -d worktree-agent-abc", False),
    ("git push --force origin Gerardo", True),
    ("git push origin +Gerardo", True),
    ("git push --force-with-lease origin rama", False),
    ("git push -u origin front/rama", False),
    ("git stash drop", True),
    ("git stash clear", True),
    ("git stash list", False),
    ("rm -rf .claude/worktrees", True),
    ("rm docs/backend-respuesta-front-qa-2026-11-24.md", True),
    ('rm "docs/CATALOGO (2).md"', True),
    ("rm CLAUDE.md", True),
    ("rm -rf ~/.claude/projects/x/memory", True),
    ("find docs -name '*.tmp' -delete", True),
    ("rm -rf node_modules dist", False),
    ("rm /private/tmp/claude-501/scratchpad/a.json", False),
    ("git rm docs/viejo.md", False),
    ("git commit -m \"no usar git reset --hard ni rm -rf docs\"", False),
    ("git commit -F - <<'EOF'\nnunca git branch -D\nEOF", False),
    ("cat docs/x.md", False),
]


def prueba() -> int:
    import tempfile

    fallas = []
    with tempfile.TemporaryDirectory() as tmp:
        limpio = os.path.join(tmp, "limpio")
        sucio = os.path.join(tmp, "sucio")
        for d in (limpio, sucio):
            os.makedirs(d)
            subprocess.run(["git", "init", "-q", d], check=True)
            with open(os.path.join(d, "a"), "w") as f:
                f.write("a")
            subprocess.run(["git", "-C", d, "add", "a"], check=True)
            subprocess.run(
                ["git", "-C", d, "-c", "user.name=g", "-c", "user.email=g@g",
                 "commit", "-qm", "a"],
                check=True,
            )
        with open(os.path.join(sucio, "a"), "w") as f:
            f.write("cambio")

        casos = [(c, f, tmp) for c, f in CASOS_SIN_ESTADO] + [
            ("git reset --hard", False, limpio),
            ("git reset --hard", True, sucio),
            (f"git -C {sucio} reset --hard HEAD", True, tmp),
            (f"cd {sucio} && git checkout -- .", True, tmp),
            (f"cd {limpio} && git checkout -- .", False, tmp),
            ("git restore a", True, sucio),
            ("git restore --staged a", False, sucio),
            ("git clean -fd", True, sucio),
            ("git clean -fd", False, limpio),
            ("git reset --soft HEAD~1", False, sucio),
        ]
        for comando, frena, cwd in casos:
            motivo = revisar(comando, cwd)
            if (motivo is not None) != frena:
                fallas.append(f"  {'debía frenar' if frena else 'frenó de más'}: {comando!r}")

    if fallas:
        print(f"✗ guardia · {len(fallas)} de {len(casos)} casos mal")
        print("\n".join(fallas))
        return 1
    print(f"✓ guardia · {len(casos)} casos")
    return 0


def main() -> int:
    if "--prueba" in sys.argv:
        return prueba()
    try:
        entrada = json.load(sys.stdin)
        if entrada.get("tool_name") != "Bash":
            return 0
        comando = entrada.get("tool_input", {}).get("command", "")
        cwd = entrada.get("cwd") or os.getcwd()
        motivo = revisar(comando, cwd)
    except Exception:  # noqa: BLE001 · ver «Si la guardia misma falla»
        return 0
    if motivo is None:
        return 0
    print(f"⛔ guardia · {motivo}\n{SALIDA}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
