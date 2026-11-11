# ai-agents-project-workspace

A repository dedicated to storing project-level AI Agent workspace folders for different use cases, with various skills and MCP tools pre-stored inside.

---

## 一、添加文档资料学习工作空间模板：document_learning_workspace

结合skills、MCP的工作流：
输入：根目录下的input文件夹中的文件。
输出：根目录下的output文件夹中的文件。

1.使用docx、pdf、pptx、xlsx解析输入的文档资料，注意全过程：需要使用Context-Engineering监控token使用；需要使用planning-with-files辅助记忆超出的上下文。

2.解析用户输入的任务要求，使用xmind制定让用户能够从萌新级别进行渐进式学习输入的文档资料的思维导图xmind文件和学习计划md文件，要求通俗易懂、简洁精炼。

3.最后，输出结果是，使用baoyu-format-markdown制作处理整理后的学习内容的md文件。

其他：（1）只有需要另外查找skills的情况下，才会使用find-skills。

---
