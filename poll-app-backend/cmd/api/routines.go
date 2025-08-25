package main

import (
	"net/http"

	"github.com/julienschmidt/httprouter"
)

func (app *application) routes() http.Handler {
	router := httprouter.New()
	router.GET("/", app.Home)
	router.GET("/about", app.About)

	// Poll routes
	router.GET("/polls", app.AllPolls)
	router.POST("/polls", app.CreatePoll)
	router.GET("/poll/:id", app.GetPoll)

	// Voting route
	router.POST("/vote", app.VoteOnPoll)

	// Authentication route
	router.POST("/login", app.Login)

	router.NotFound = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "Not Found", http.StatusNotFound)
	})

	return app.enableCORS(router)
}
