cd /root/auto_sniper_backend
pnpm install
pnpm build
sudo systemctl daemon-reload
sudo systemctl restart auto-sniper.service
sudo systemctl status auto-sniper.service
sudo journalctl -u auto-sniper.service -f
