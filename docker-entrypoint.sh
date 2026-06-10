#!/bin/bash
set -e

# Extract the command passed to the container
cmd="$@"

echo "Starting docker-entrypoint.sh"

# Optional: Run Prisma migrations before starting the app
# In Kubernetes, it's better to use a dedicated Migration Job.
# Set RUN_MIGRATIONS=true in env to enable this.
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running Prisma migrations..."
  npx prisma migrate deploy
  echo "Migrations completed."
fi

# Execute the main command (e.g., 'node dist/server.js' or 'node dist/workers/index.js')
echo "Executing: $cmd"
exec $cmd
