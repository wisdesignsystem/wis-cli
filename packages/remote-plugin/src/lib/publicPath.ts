export function publicPath() {
  if (!process.env.BASE_URL) {
    return;
  }

  let publicUrl = process.env.BASE_URL
  if (!publicUrl.endsWith("/")) {
    publicUrl = `${publicUrl}/`
  }

  return `return "${publicUrl}"`
}
