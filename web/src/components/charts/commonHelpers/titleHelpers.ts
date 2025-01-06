export const truncateWithEllipsis = (text: string, maxLength: number = 52) =>
  text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
