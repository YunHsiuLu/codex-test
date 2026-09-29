export function unreadMessages(messages, users, userId, roomId, readIds) {
  const read = new Set(readIds || []);
  const demoIds = new Set(users.filter(user => user.demo).map(user => user.id));
  return messages.filter(message => message.roomId === roomId && message.userId !== userId && !demoIds.has(message.userId) && !read.has(message.id)).length;
}
export function notificationTitle(count) {
  return count > 0 ? `（${count}）新訊息｜Together` : 'Together｜讓合作更靠近';
}
