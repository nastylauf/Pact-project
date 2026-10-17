package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/nastylauf/Pact-project/internal/auth"
	"github.com/nastylauf/Pact-project/internal/config"
	"github.com/nastylauf/Pact-project/internal/handler"
	"github.com/nastylauf/Pact-project/internal/repository"
	"github.com/nastylauf/Pact-project/internal/service"
)

func main() {
	if err := run(); err != nil {
		slog.Error("API stopped", "error", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	poolCtx, cancelPool := context.WithTimeout(context.Background(), 10*time.Second)
	pool, err := repository.NewPostgresPool(poolCtx, cfg.DatabaseURL)
	cancelPool()
	if err != nil {
		return err
	}
	defer pool.Close()

	tokens, err := auth.NewTokenManager(cfg.JWTSecret, 24*time.Hour)
	if err != nil {
		return fmt.Errorf("configure token manager: %w", err)
	}
	userRepository := repository.NewUserRepository(pool)
	pactRepository := repository.NewPactRepository(pool)
	checkinRepository := repository.NewCheckinRepository(pool)

	authService := service.NewAuthService(userRepository, tokens)
	pactService := service.NewPactService(pactRepository)
	checkinService := service.NewCheckinService(checkinRepository, pactRepository)
	apiHandler := handler.NewRouter(authService, pactService, checkinService, tokens)

	server := &http.Server{
		Addr:              ":" + cfg.HTTPPort,
		Handler:           apiHandler,
		ReadHeaderTimeout: 5 * time.Second,
	}
	shutdownCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	serverErrors := make(chan error, 1)
	go func() {
		slog.Info("starting HTTP server", "address", server.Addr)
		serverErrors <- server.ListenAndServe()
	}()

	select {
	case err := <-serverErrors:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return fmt.Errorf("HTTP server: %w", err)
	case <-shutdownCtx.Done():
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := server.Shutdown(ctx); err != nil {
			return fmt.Errorf("shutdown HTTP server: %w", err)
		}
		if err := <-serverErrors; err != nil && !errors.Is(err, http.ErrServerClosed) {
			return fmt.Errorf("HTTP server: %w", err)
		}
		return nil
	}
}
