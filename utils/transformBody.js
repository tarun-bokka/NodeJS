function transformPayload(baseBody, mapper, sourceItem) {
  const newBody = { ...baseBody };
  for (const [targetField, sourceField] of Object.entries(mapper)) {
    newBody[targetField] = sourceItem[sourceField];
  }
  return newBody;
}

module.exports = { transformPayload };
