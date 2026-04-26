export function sortByNewest(items, dateKey = "created_at", idKey = "id") {
  return [...items].sort((a, b) => {
    const dateA = a?.[dateKey] ? new Date(a[dateKey]).getTime() : 0;
    const dateB = b?.[dateKey] ? new Date(b[dateKey]).getTime() : 0;

    if (dateA !== dateB) {
      return dateB - dateA;
    }

    return Number(b?.[idKey] || 0) - Number(a?.[idKey] || 0);
  });
}
