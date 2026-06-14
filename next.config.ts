import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 클라이언트 전용 앱: Netlify/Vercel 정적 배포를 위한 정적 export
  output: "export",
  // 같은 네트워크의 다른 기기(모바일 등)에서 dev 서버 접속 허용
  allowedDevOrigins: ["192.168.10.122"],
};

export default nextConfig;
