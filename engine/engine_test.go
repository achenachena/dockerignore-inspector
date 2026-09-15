package engine

import (
	"github.com/moby/patternmatcher"
	"github.com/moby/patternmatcher/ignorefile"
	"strings"
	"testing"
)

func TestMatchesUpstreamAndExplains(t *testing.T) {
	texts := []string{"", "cache\n!cache/a\ncache/a", "**/*.log\n!keep.log", "\ufeff# comment\r\n  /a/  \r\n.\r\n", "a?/[xy]", "*\n!assets\n!assets/**"}
	paths := []string{"a", "a/b", "cache/a", "cache/b", "keep.log", "nested/debug.log", "ab/x", "assets/logo.svg"}
	for _, text := range texts {
		patterns, err := ignorefile.ReadAll(strings.NewReader(text))
		if err != nil {
			t.Fatal(err)
		}
		filtered := []string{}
		for _, p := range patterns {
			if p != "." {
				filtered = append(filtered, p)
			}
		}
		matcher, err := patternmatcher.New(filtered)
		if err != nil {
			t.Fatal(err)
		}
		for _, path := range paths {
			want, err := matcher.MatchesOrParentMatches(path)
			if err != nil {
				t.Fatal(err)
			}
			got := Evaluate(Request{Text: text, Paths: []string{path}, Explain: path})
			if got.Error != "" || got.Excluded[0] != want {
				t.Fatalf("%q %q: %+v, want %v", text, path, got, want)
			}
			state := false
			if len(got.Reasons) > 0 {
				state = got.Reasons[len(got.Reasons)-1].Excluded
			}
			if state != want {
				t.Fatalf("explanation disagrees for %q", path)
			}
		}
	}
}
func TestLineNumber(t *testing.T) {
	result := Evaluate(Request{Text: "\ufeff# Header\r\n\r\na\r\n!a\r\na", Paths: []string{"a"}, Explain: "a"})
	if len(result.Reasons) != 3 || result.Reasons[0].Line != 3 || result.Reasons[2].Line != 5 {
		t.Fatalf("%+v", result)
	}
	if Evaluate(Request{Text: "ok\n!"}).Error == "" {
		t.Fatal("invalid rule accepted")
	}
}
