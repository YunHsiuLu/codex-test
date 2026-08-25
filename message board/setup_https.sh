#!/bin/zsh

set -eu

SCRIPT_DIR=${0:A:h}
CERT_ROOT="$SCRIPT_DIR/data/https"
PRIVATE_DIR="$CERT_ROOT/private"
PUBLIC_DIR="$CERT_ROOT/public"
CA_KEY="$PRIVATE_DIR/teacher-messenger-ca-key.pem"
CA_CERT="$PRIVATE_DIR/teacher-messenger-ca.crt"
SERVER_KEY="$PRIVATE_DIR/server-key.pem"
SERVER_CERT="$PRIVATE_DIR/server-cert.pem"
SERVER_CSR="$PRIVATE_DIR/server.csr"
SERVER_EXT="$PRIVATE_DIR/server-ext.cnf"
IP_FILE="$PRIVATE_DIR/server-ip.txt"
RENEWED_FILE="$CERT_ROOT/server-cert-renewed"

get_lan_ip() {
    local interface
    local address

    interface=$(route -n get default 2>/dev/null | awk '/interface:/{print $2}')
    if [[ -n "$interface" ]]; then
        address=$(ipconfig getifaddr "$interface" 2>/dev/null || true)
    fi

    if [[ -z "${address:-}" ]]; then
        for interface in en0 en1 en2; do
            address=$(ipconfig getifaddr "$interface" 2>/dev/null || true)
            [[ -n "$address" ]] && break
        done
    fi

    printf '%s' "${address:-}"
}

if ! command -v openssl >/dev/null 2>&1; then
    echo "找不到 OpenSSL，無法建立 HTTPS 憑證。"
    exit 1
fi

LAN_IP=${HTTPS_LAN_IP:-$(get_lan_ip)}
if [[ -z "$LAN_IP" ]]; then
    echo "無法取得區域網路 IP，請先連接 Wi-Fi 或網路。"
    exit 1
fi

mkdir -p "$PRIVATE_DIR" "$PUBLIC_DIR"
chmod 700 "$PRIVATE_DIR"
rm -f "$RENEWED_FILE"

if [[ ! -f "$CA_KEY" || ! -f "$CA_CERT" ]]; then
    openssl genrsa -out "$CA_KEY" 3072 >/dev/null 2>&1
    openssl req -x509 -new -sha256 -days 3650 \
        -key "$CA_KEY" \
        -out "$CA_CERT" \
        -subj "/CN=Teacher Messenger Local CA/O=Teacher Messenger" \
        -addext "basicConstraints=critical,CA:TRUE" \
        -addext "keyUsage=critical,keyCertSign,cRLSign" >/dev/null 2>&1
fi

CURRENT_IP=$(cat "$IP_FILE" 2>/dev/null || true)
if [[ ! -f "$SERVER_KEY" || ! -f "$SERVER_CERT" || "$CURRENT_IP" != "$LAN_IP" ]]; then
    cat > "$SERVER_EXT" <<EOF
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=IP:$LAN_IP,IP:127.0.0.1,DNS:localhost
EOF

    openssl genrsa -out "$SERVER_KEY" 2048 >/dev/null 2>&1
    openssl req -new -sha256 \
        -key "$SERVER_KEY" \
        -out "$SERVER_CSR" \
        -subj "/CN=$LAN_IP/O=Teacher Messenger" >/dev/null 2>&1
    openssl x509 -req -sha256 -days 365 \
        -in "$SERVER_CSR" \
        -CA "$CA_CERT" \
        -CAkey "$CA_KEY" \
        -CAcreateserial \
        -out "$SERVER_CERT" \
        -extfile "$SERVER_EXT" >/dev/null 2>&1
    printf '%s' "$LAN_IP" > "$IP_FILE"
    touch "$RENEWED_FILE"
fi

cp "$CA_CERT" "$PUBLIC_DIR/teacher-messenger-ca.crt"
chmod 600 "$CA_KEY" "$SERVER_KEY"

echo "HTTPS 憑證已準備完成，伺服器 IP：$LAN_IP"
