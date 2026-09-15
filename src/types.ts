export interface Entry {
  path: string;
  kind: "file" | "directory" | "symlink" | "unknown";
  size: number | null;
  error?: string;
}
export interface Reason {
  line: number;
  rule: string;
  excluded: boolean;
}
export interface MatchResult {
  excluded: boolean[];
  reasons: Reason[];
  error?: string;
}
export interface Scan {
  entries: Entry[];
  partial: boolean;
  issues: string[];
}
export interface Snapshot extends Scan {
  context: string;
  dockerfile: string;
  ignore: string | null;
  specific: boolean;
  draft: boolean;
  text: string;
  savedText: string;
  excluded: boolean[];
  savedExcluded: boolean[];
  error?: string;
  elapsed: number;
}
