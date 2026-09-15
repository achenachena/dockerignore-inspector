//go:build js && wasm

package main

import (
	engine "dockerignore-inspector/engine"
	"encoding/json"
	"syscall/js"
)

func main() {
	js.Global().Set("dockerignoreEvaluate", js.FuncOf(func(_ js.Value, args []js.Value) any {
		var req engine.Request
		if err := json.Unmarshal([]byte(args[0].String()), &req); err != nil {
			value, _ := json.Marshal(engine.Response{Error: err.Error()})
			return string(value)
		}
		value, _ := json.Marshal(engine.Evaluate(req))
		return string(value)
	}))
	select {}
}
