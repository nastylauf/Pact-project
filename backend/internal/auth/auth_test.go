package auth

import (
	"testing"
	"time"
)

func TestPasswordHashAndCompare(t *testing.T) {
	password := "correct horse battery staple"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword() error = %v", err)
	}
	if hash == password {
		t.Fatal("HashPassword() returned the plain-text password")
	}
	if err := ComparePassword(hash, password); err != nil {
		t.Fatalf("ComparePassword() error = %v", err)
	}
	if err := ComparePassword(hash, "incorrect password"); err == nil {
		t.Fatal("ComparePassword() accepted an incorrect password")
	}
}

func TestTokenManagerGenerateAndParse(t *testing.T) {
	manager, err := NewTokenManager("01234567890123456789012345678901", time.Minute)
	if err != nil {
		t.Fatalf("NewTokenManager() error = %v", err)
	}

	token, err := manager.Generate("user-123")
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}
	userID, err := manager.Parse(token)
	if err != nil {
		t.Fatalf("Parse() error = %v", err)
	}
	if userID != "user-123" {
		t.Fatalf("Parse() user ID = %q, want %q", userID, "user-123")
	}
	if _, err := manager.Parse(token + "invalid"); err == nil {
		t.Fatal("Parse() accepted a modified token")
	}
}
