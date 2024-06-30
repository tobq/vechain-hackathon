#!/bin/bash
CACHE_DIR=$NETLIFY_BUILD_BASE/cache

rm -rf $HOME/.m2/
cp -a $NETLIFY_BUILD_BASE/cache/.m2/ $HOME/.m2/

JAVA_DOWNLOAD_URL="https://download.java.net/java/GA/jdk17.0.2/dfd4a8d0985749f896bed50d7138ee7f/8/GPL/openjdk-17.0.2_linux-x64_bin.tar.gz"
JAVA_RELEASE=jdk-17.0.2 # Must match directory inside archive in JAVA_DOWNLOAD_URL

currentver="$(java -version 2>&1 |head -n1 | cut -d'"' -f2 |cut -d'.' -f1)"
# get required var from script args - default to "11"
requiredver=${1:-"11"}


# Version check shamelessly copied from StackOverflow:
# https://unix.stackexchange.com/a/285928
if [ ! "$(printf '%s\n' "$requiredver" "$currentver" | sort -V | head -n1)" = "$requiredver" ]; then

  echo "Java version 11 is required as minimum by OpenApi Generator (found Java version $currentver)"

  if [ ! -d "$CACHE_DIR/$JAVA_RELEASE" ]; then
    echo "Downloading $JAVA_RELEASE since it isn't available in cache"

    wget --quiet -O openjdk.tar.gz $JAVA_DOWNLOAD_URL
    tar xf openjdk.tar.gz --directory $CACHE_DIR
  fi

  echo "Enabling $JAVA_RELEASE from cache, by making it available on PATH"

  export PATH=$CACHE_DIR/$JAVA_RELEASE/bin:$PATH

  echo "Java version is now $(java -version 2>&1 |head -n1 | cut -d'"' -f2)"

else
  echo "Java version is already $currentver, which is sufficient for OpenApi Generator"
fi