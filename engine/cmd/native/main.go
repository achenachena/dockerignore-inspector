// Command native is a test oracle using the host's native Go path semantics.
package main

import (
 "encoding/json"
 "os"
 engine "dockerignore-inspector/engine"
)

func main() {
 var requests []engine.Request
 if err := json.NewDecoder(os.Stdin).Decode(&requests); err != nil { panic(err) }
 results := make([]engine.Response, len(requests))
 for i, request := range requests { results[i] = engine.Evaluate(request) }
 if err := json.NewEncoder(os.Stdout).Encode(results); err != nil { panic(err) }
}
