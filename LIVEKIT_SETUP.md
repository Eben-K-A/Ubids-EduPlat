# LiveKit + Egress (Local Dev)

## 1) Start LiveKit + Egress with Docker Compose
From project root:

```bash
mkdir -p recordings

docker compose -f docker-compose.livekit.yml up -d
```

## 2) Backend env
Set in `backend-simple/.env`:
```
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
LIVEKIT_URL=http://localhost:7880
LIVEKIT_EGRESS_URL=http://localhost:7880
RECORDINGS_DIR=/absolute/path/to/UBIDS EduPlat/recordings
LIVEKIT_EGRESS_OUTPUT_DIR=/recordings
```

Notes:
- `LIVEKIT_EGRESS_OUTPUT_DIR` is the path **inside the Egress container**.
- `RECORDINGS_DIR` is the **host** path used by the backend to serve `/recordings/*`.
- The default compose mounts `./recordings` to `/recordings`.

## 3) Frontend env
Set in `.env.local`:
```
VITE_LIVEKIT_URL=ws://localhost:7880
```

## 4) Firewall
If you test across devices, ensure these ports are open on the host:
- `7880/tcp` (LiveKit WS)
- `7881/udp` (WebRTC)
- `50000-50100/udp` (WebRTC media)
