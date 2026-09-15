package engine

import (
	"fmt"
	"strings"

	"github.com/moby/patternmatcher"
	"github.com/moby/patternmatcher/ignorefile"
)

type Request struct {
	Text    string   `json:"text"`
	Paths   []string `json:"paths"`
	Explain string   `json:"explain"`
}
type Reason struct {
	Line     int    `json:"line"`
	Rule     string `json:"rule"`
	Excluded bool   `json:"excluded"`
}
type Response struct {
	Excluded []bool   `json:"excluded"`
	Reasons  []Reason `json:"reasons"`
	Error    string   `json:"error,omitempty"`
}

// Evaluate uses the upstream matcher for final states and each effective prefix
// for an on-demand explanation. Prefix evaluation avoids private matcher APIs.
func Evaluate(req Request) Response {
	patterns := []string{}
	lines := []int{}
	raw := strings.Split(req.Text, "\n")
	for i, line := range raw {
		if i > 0 {
			line = "\n" + line
		}
		normalized, err := ignorefile.ReadAll(strings.NewReader(line))
		if err != nil {
			return Response{Error: fmt.Sprintf("Line %d: %v", i+1, err)}
		}
		for _, p := range normalized {
			if p == "." {
				continue
			}
			if _, err := patternmatcher.New([]string{p}); err != nil {
				return Response{Error: fmt.Sprintf("Line %d: %v", i+1, err)}
			}
			patterns = append(patterns, p)
			lines = append(lines, i+1)
		}
	}
	matcher, err := patternmatcher.New(patterns)
	if err != nil {
		return Response{Error: err.Error()}
	}
	out := Response{Excluded: make([]bool, len(req.Paths)), Reasons: []Reason{}}
	for i, path := range req.Paths {
		excluded, err := matcher.MatchesOrParentMatches(path)
		if err != nil {
			return Response{Error: fmt.Sprintf("Invalid rule while matching %s: %v", path, err)}
		}
		out.Excluded[i] = excluded
	}
	if req.Explain != "" {
		previous := false
		for i := range patterns {
			prefix, _ := patternmatcher.New(patterns[:i+1])
			excluded, err := prefix.MatchesOrParentMatches(req.Explain)
			if err != nil {
				return Response{Error: fmt.Sprintf("Line %d: %v", lines[i], err)}
			}
			if excluded != previous {
				out.Reasons = append(out.Reasons, Reason{Line: lines[i], Rule: strings.TrimSuffix(raw[lines[i]-1], "\r"), Excluded: excluded})
			}
			previous = excluded
		}
	}
	return out
}
