PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  . "$PROJECT_ROOT/.env"
  set +a
fi

VSC_RUNTIME_ROOT="$PROJECT_ROOT/.tools"

if [ -d "$PROJECT_ROOT/dependencies/runtime" ]; then
  VSC_RUNTIME_ROOT="$PROJECT_ROOT/dependencies/runtime"
fi

export PROJECT_ROOT
export VSC_RUNTIME_ROOT

if [ -d "$VSC_RUNTIME_ROOT/jdk" ]; then
  export JAVA_HOME="$VSC_RUNTIME_ROOT/jdk"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

if [ -d "$VSC_RUNTIME_ROOT/maven" ]; then
  export M2_HOME="$VSC_RUNTIME_ROOT/maven"
  export MAVEN_HOME="$M2_HOME"
  export PATH="$M2_HOME/bin:$PATH"
fi

if [ -d "$VSC_RUNTIME_ROOT/mysql/bin" ]; then
  export PATH="$VSC_RUNTIME_ROOT/mysql/bin:$PATH"
fi

if [ -d "$VSC_RUNTIME_ROOT/node-global/bin" ]; then
  export PATH="$VSC_RUNTIME_ROOT/node-global/bin:$PATH"
fi

if [ -d "$VSC_RUNTIME_ROOT/lib/usr/lib/x86_64-linux-gnu" ]; then
  export LD_LIBRARY_PATH="$VSC_RUNTIME_ROOT/lib/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"
fi

export NG_CLI_ANALYTICS=false
