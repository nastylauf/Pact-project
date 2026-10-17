package domain

import "errors"

var (
	ErrNotFound           = errors.New("not found")
	ErrAlreadyExists      = errors.New("already exists")
	ErrPactNotActive      = errors.New("pact is not active")
	ErrAlreadyCheckedIn   = errors.New("already checked in for this date")
	ErrCheckInInFuture    = errors.New("cannot check in for a future date")
	ErrForbidden          = errors.New("forbidden")
	ErrInvalidInput       = errors.New("invalid input")
	ErrInvalidCredentials = errors.New("invalid email or password")
)
