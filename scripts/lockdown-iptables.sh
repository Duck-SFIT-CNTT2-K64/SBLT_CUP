#!/bin/bash
# lockdown-iptables.sh — Bật/tắt iptables lockdown từ file .lockdown
# Usage: sudo ./scripts/lockdown-iptables.sh

LOCKDOWN_FILE="/home/dev/SBLT_CUP/.lockdown"
CHAIN="SBLT_LOCKDOWN"

if [ ! -f "$LOCKDOWN_FILE" ]; then
  echo "No .lockdown file found"
  exit 1
fi

ENABLED=$(grep -oP '^ENABLED=\K.*' "$LOCKDOWN_FILE")
IPS=$(grep -oP '^IPS=\K.*' "$LOCKDOWN_FILE")

# Flush old rules
iptables -F $CHAIN 2>/dev/null
iptables -X $CHAIN 2>/dev/null
ip6tables -F $CHAIN 2>/dev/null
ip6tables -X $CHAIN 2>/dev/null

if [ "$ENABLED" != "true" ]; then
  echo "Lockdown disabled — all traffic allowed"
  exit 0
fi

echo "Lockdown enabled — blocking all except: $IPS"

# Create chain
iptables -N $CHAIN
ip6tables -N $CHAIN

# Allow whitelisted IPs
IFS=',' read -ra IP_LIST <<< "$IPS"
for ip in "${IP_LIST[@]}"; do
  ip=$(echo "$ip" | xargs) # trim
  if [[ "$ip" == *:* ]]; then
    # IPv6
    ip6tables -A $CHAIN -s "$ip" -j ACCEPT
    echo "  [IPv6] Allow: $ip"
  else
    # IPv4
    iptables -A $CHAIN -s "$ip" -j ACCEPT
    echo "  [IPv4] Allow: $ip"
  fi
done

# Allow localhost
iptables -A $CHAIN -s 127.0.0.1 -j ACCEPT
ip6tables -A $CHAIN -s ::1 -j ACCEPT

# Allow established connections (return traffic)
iptables -A $CHAIN -m state --state ESTABLISHED,RELATED -j ACCEPT
ip6tables -A $CHAIN -m state --state ESTABLISHED,RELATED -j ACCEPT

# Drop everything else
iptables -A $CHAIN -j DROP
ip6tables -A $CHAIN -j DROP

# Insert chain into INPUT (port 80 + 443)
iptables -I INPUT -p tcp --dport 80 -j $CHAIN
iptables -I INPUT -p tcp --dport 443 -j $CHAIN
ip6tables -I INPUT -p tcp --dport 80 -j $CHAIN
ip6tables -I INPUT -p tcp --dport 443 -j $CHAIN

echo "iptables lockdown active — only whitelisted IPs can access port 80/443"
