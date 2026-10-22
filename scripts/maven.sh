#!/usr/bin/env bash
set -euo pipefail
# Pinned official Apache Maven archive; SHA-512 from Maven Central.
MAVEN_VERSION=3.9.11
MAVEN_SHA512=bcfe4fe305c962ace56ac7b5fc7a08b87d5abd8b7e89027ab251069faebee516b0ded8961445d6d91ec1985dfe30f8153268843c89aa392733d1a3ec956c9978
BRSE_TOOLS="${BRSE_TOOLS_DIR:-/workspace/.brse-tools}"
BRSE_M2="${BRSE_MAVEN_REPO:-/workspace/.brse-m2}"
mkdir -p "$BRSE_TOOLS" "$BRSE_M2"
if [[ ! -x "$BRSE_TOOLS/apache-maven-$MAVEN_VERSION/bin/mvn" ]]; then
  BRSE_ARCHIVE=$(mktemp /tmp/brse-maven.XXXXXX.tar.gz)
  trap 'rm -f "$BRSE_ARCHIVE"' EXIT
  curl --fail --silent --show-error --location "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/$MAVEN_VERSION/apache-maven-$MAVEN_VERSION-bin.tar.gz" -o "$BRSE_ARCHIVE"
  printf '%s  %s\n' "$MAVEN_SHA512" "$BRSE_ARCHIVE" | sha512sum --check --status
  tar -xzf "$BRSE_ARCHIVE" -C "$BRSE_TOOLS"
  rm -f "$BRSE_ARCHIVE"
  trap - EXIT
fi
BRSE_SETTINGS_ARGS=()
if [[ -n "${HTTPS_PROXY:-}" ]]; then
  BRSE_SETTINGS=$(mktemp /tmp/brse-maven-settings.XXXXXX.xml)
  trap 'rm -f "$BRSE_SETTINGS"' EXIT
  python3 - "$BRSE_SETTINGS" <<'PYXML'
import os,sys,urllib.parse,xml.etree.ElementTree as E
u=urllib.parse.urlparse(os.environ['HTTPS_PROXY'])
if not u.hostname or u.username or u.password:
 raise SystemExit('Unsupported Maven proxy configuration; no credentials are copied')
root=E.Element('settings'); proxies=E.SubElement(root,'proxies'); proxy=E.SubElement(proxies,'proxy')
for name,value in [('id','brse-runtime'),('active','true'),('protocol','http'),('host',u.hostname),('port',str(u.port or 80)),('nonProxyHosts','localhost|127.0.0.1')]:
 E.SubElement(proxy,name).text=value
E.ElementTree(root).write(sys.argv[1],encoding='unicode')
PYXML
  BRSE_SETTINGS_ARGS=(-s "$BRSE_SETTINGS")
fi
# This cloud image has Java 21 compiler modules but omits ct.sym/javac launcher.
# Compile against the actual Java 21 runtime modules using source/target on this image.
BRSE_COMPILER_ARGS=()
BRSE_JAVA_HOME="${JAVA_HOME:-$(dirname "$(dirname "$(readlink -f "$(command -v java)")")")}"
if [[ ! -f "$BRSE_JAVA_HOME/lib/ct.sym" ]]; then
  [[ "$(java com.sun.tools.javac.Main --version)" == javac\ 21.* ]] || { echo 'A complete JDK 21 is required' >&2; exit 1; }
  BRSE_COMPILER_ARGS=(-Dmaven.compiler.release= -Dmaven.compiler.source=21 -Dmaven.compiler.target=21)
fi
"$BRSE_TOOLS/apache-maven-$MAVEN_VERSION/bin/mvn" "${BRSE_SETTINGS_ARGS[@]}" "${BRSE_COMPILER_ARGS[@]}" -Dmaven.repo.local="$BRSE_M2" "$@"
