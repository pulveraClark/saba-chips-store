const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
const serverOrigin =
  import.meta.env.VITE_SERVER_ORIGIN ||
  apiBaseUrl.replace(/\/api\/?$/, "");

export function getMediaUrl(path) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${serverOrigin}${path}`;
}
