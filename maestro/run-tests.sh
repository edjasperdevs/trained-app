#!/bin/bash

# Set up Java 17 for Maestro
export JAVA_HOME="/usr/local/opt/openjdk@17"
export PATH="$JAVA_HOME/bin:$PATH:$HOME/.maestro/bin"

# Disable analytics prompts
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}WellTrained iOS Auth Tests${NC}"
echo "================================"

# Check if simulator is running
if ! xcrun simctl list devices | grep -q "Booted"; then
    echo -e "${RED}No iOS simulator is running!${NC}"
    echo "Start a simulator first:"
    echo "  open -a Simulator"
    echo "Or specify a device:"
    echo "  xcrun simctl boot 'iPhone 15 Pro'"
    exit 1
fi

# Get booted device
DEVICE=$(xcrun simctl list devices | grep "Booted" | head -1 | sed 's/.*(\([^)]*\)).*/\1/')
echo -e "${GREEN}Using simulator: $DEVICE${NC}"

# Create output directory for screenshots
mkdir -p maestro/screenshots

# Run specified test or all tests
if [ -n "$1" ]; then
    echo -e "\n${YELLOW}Running: $1${NC}"
    maestro test "maestro/$1" --output maestro/screenshots
else
    echo -e "\n${YELLOW}Running all auth tests...${NC}"

    echo -e "\n--- Testing Google Auth ---"
    maestro test maestro/test-google-auth.yaml --output maestro/screenshots || true

    echo -e "\n--- Testing Apple Auth ---"
    maestro test maestro/test-apple-auth.yaml --output maestro/screenshots || true

    echo -e "\n--- Testing Email Auth ---"
    maestro test maestro/test-email-auth.yaml --output maestro/screenshots || true
fi

echo -e "\n${GREEN}Screenshots saved to: maestro/screenshots/${NC}"
echo "Done!"
