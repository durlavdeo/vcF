class PeerService {
  constructor() {
    if (!this.peer) {
      this.peer = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:global.stun.twilio.com:3478",
          },
          {
            urls: "turn:global.turn.twilio.com:3478?transport=udp",
            username:
              "851068581028298853b59024be54da4d6f6b03c4f2ea104141904347e53024dd",
            credential: "LS2UHzspJ2MDtNORrATtlJfGXGSAoN/7ZbsW5hLz4y0=",
          },
          {
            urls: "turn:global.turn.twilio.com:3478?transport=tcp",
            username:
              "851068581028298853b59024be54da4d6f6b03c4f2ea104141904347e53024dd",
            credential: "LS2UHzspJ2MDtNORrATtlJfGXGSAoN/7ZbsW5hLz4y0=",
          },
          {
            urls: "turn:global.turn.twilio.com:443?transport=tcp",
            username:
              "851068581028298853b59024be54da4d6f6b03c4f2ea104141904347e53024dd",
            credential: "LS2UHzspJ2MDtNORrATtlJfGXGSAoN/7ZbsW5hLz4y0=",
          },
        ],
      });
    }
  }

  async getAnswer(offer) {
    if (this.peer) {
      await this.peer.setRemoteDescription(offer);
      const answer = await this.peer.createAnswer();
      await this.peer.setLocalDescription(new RTCSessionDescription(answer));
      return answer;
    }
  }

  async setLocalDescription(answer) {
    if (this.peer) {
      await this.peer.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  async getOffer() {
    if (this.peer) {
      const offer = await this.peer.createOffer();
      await this.peer.setLocalDescription(offer);
      return offer;
    }
  }
}

export default new PeerService();
