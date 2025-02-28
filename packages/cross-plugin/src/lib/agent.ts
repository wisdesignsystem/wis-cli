function isMobile(ua: string) {
  return /\b(BlackBerry|webOS|iPhone|IEMobile|Android|Windows Phone|iPod)\b/i.test(
    ua,
  );
}

function isPad(ua: string) {
  return /\b(iPad)\b/i.test(ua);
}

export function getBrowserAgent() {
  // @ts-ignore
  const ua = window.navigator.userAgent;

  if (isMobile(ua)) {
    return "mobile";
  }

  if (isPad(ua)) {
    return "pad";
  }

  return;
}
