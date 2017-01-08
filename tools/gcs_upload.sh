#!/bin/bash

# Fail if trying to use an undeclared variable, or if any command fails.
set -u -e

# Parameters
# ----------
# First argument: The IITC build type to upload (i.e. the argument to
#   build.py).
# Second argument: The target upload directory.
# Third argument: Optional. The GCS bucket name to upload to. Defaults to
#   static.iitc.me.

readonly BUILDTYPE="${1:?First argument must be the build type to upload}"
readonly TARGET="${2:?Second argument must be the target directory}"
readonly BUCKET="${3:-static.iitc.me}"

# Absolute path to base directory for the repository. This trick reportedly
# doesn't work on OSX.
readonly REPO_BASE="$(dirname "$(dirname "$(readlink -f "$0")")")"
readonly BUILD_ROOT="${REPO_BASE}/build"
readonly APK_CONTENT_TYPE='application/vnd.android.package-archive'
readonly PLAIN_CONTENT_TYPE='text/plain'

# Change to repo base.
cd "${REPO_BASE}"

readonly SOURCE="${BUILD_ROOT}/${BUILDTYPE}"

# See if IITC has been built, or build it if necessary.
[[ -e "${SOURCE}" ]] || {
  echo "WARNING: No IITC build for ${BUILDTYPE}, building." >&2
  ./build.py "${BUILDTYPE}"
}

# See if IITC built successfully.
[[ -e "${SOURCE}/total-conversion-build.user.js" ]] || {
  echo "ERROR: Built IITC still doesn't exist at ${SOURCE}/" >&2
  exit 1
}

# Make sure we have the right tools we need.
[[ -x "$(which gsutil 2>/dev/null)" ]] || {
  echo "ERROR: No gsutil found! Please install the Google Cloud SDK." >&2
  exit 1
}

echo "Uploading ${SOURCE}/ -> gs://${BUCKET}/build/${TARGET}/"

# From here on, echo commands before they execute.
set -x

# Do the actual synchronization.
gsutil -m rsync -r -c "${SOURCE}/" "gs://${BUCKET}/build/${TARGET}/"

# Fix metadata.
gsutil -m setmeta -h "Content-Type:${PLAIN_CONTENT_TYPE}" "gs://${BUCKET}/build/${TARGET}/.build-timestamp"
for apkfile in "${SOURCE}/"*.apk; do
  apkfile="${apkfile#${SOURCE}/}"
  gsutil -m setmeta -h "Content-Type:${APK_CONTENT_TYPE}" "gs://${BUCKET}/build/${TARGET}/${apkfile}"
done
