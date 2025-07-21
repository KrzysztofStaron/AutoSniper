# Node.js Update Guide for Auto Sniper Backend

## Problem

Your server is running an old version of Node.js that doesn't support the `node:` prefix for built-in modules, causing the error:

```
Error: Cannot find module 'node:path'
```

## Solution: Update Node.js on your server

### Option 1: Using Node Version Manager (nvm) - Recommended

1. SSH into your server:

```bash
ssh your-server
```

2. Install nvm:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

3. Reload your shell configuration:

```bash
source ~/.bashrc
```

4. Install Node.js 18 (LTS):

```bash
nvm install 18
nvm use 18
nvm alias default 18
```

5. Verify the installation:

```bash
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

6. Install pnpm globally:

```bash
npm install -g pnpm@10.7.1
```

### Option 2: Using NodeSource Repository

1. SSH into your server:

```bash
ssh your-server
```

2. Add NodeSource repository for Node.js 18:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
```

3. Install Node.js:

```bash
sudo apt-get install -y nodejs
```

4. Verify the installation:

```bash
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

5. Install pnpm globally:

```bash
npm install -g pnpm@10.7.1
```

### After updating Node.js:

1. Navigate to your project directory:

```bash
cd /path/to/auto_sniper_backend
```

2. Clean install dependencies:

```bash
rm -rf node_modules
pnpm install
```

3. Build the project:

```bash
pnpm build
```

4. Restart your service:

```bash
sudo systemctl restart auto-sniper.service
```

5. Check the service status:

```bash
sudo systemctl status auto-sniper.service
```

## Alternative: If you cannot update Node.js

If you absolutely cannot update Node.js on your server, you would need to:

1. Downgrade all dependencies to versions compatible with your Node.js version
2. Use older versions of pnpm (e.g., pnpm@6.x for Node.js 10)
3. This is NOT recommended as it may introduce security vulnerabilities and compatibility issues

## Minimum Requirements

- Node.js: >= 18.0.0
- pnpm: >= 10.0.0
- npm: >= 9.0.0
