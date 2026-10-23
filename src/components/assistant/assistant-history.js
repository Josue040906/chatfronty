export function toUiMessages(messages) {
  return messages
    .filter((message) => {
      const role = message.role?.toUpperCase();
      return role === 'USER' || role === 'ASSISTANT';
    })
    .map((message) => ({
      id: message.id,
      role: message.role.toLowerCase(),
      content: message.content,
    }));
}
