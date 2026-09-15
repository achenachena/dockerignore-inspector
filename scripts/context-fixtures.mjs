export const cases = [
  { name: "no rules", text: "" },
  {
    name: "negations and ancestors",
    text: "cache\n!cache/keep.txt\n**/*.log\nassets/*\n!assets/logo.svg",
  },
  {
    name: "control files excluded",
    text: "Dockerfile\n.dockerignore\ndocker\n*.log",
  },
  {
    name: "dedicated overrides root",
    text: "*",
    dedicated: "assets/*\n!assets/logo.svg",
  },
  { name: "empty dedicated overrides root", text: "*", dedicated: "" },
  {
    name: "BOM CRLF and normalization",
    text: "\ufeff# Header\r\n /cache/ \r\n!cache/keep.txt\r\nassets/[dl]*\r\n",
  },
  { name: "case-sensitive matching", text: "mixedcase.txt\nHELLO 世界.TXT" },
  {
    name: "spaces Unicode and case",
    text: "MixedCase.TXT\nhello 世界.txt\nassets/with space.txt",
  },
  {
    name: "slash and parent normalization",
    text: "/assets/../cache/\n!cache/keep.txt\n**/*.log",
  },
];
