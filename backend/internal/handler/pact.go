package handler

import (
	"net/http"
	"time"

	"github.com/nastylauf/Pact-project/internal/domain"
	"github.com/nastylauf/Pact-project/internal/middleware"
	"github.com/nastylauf/Pact-project/internal/service"
)

type PactHandler struct {
	pacts    *service.PactService
	checkins *service.CheckinService
}

func NewPactHandler(pacts *service.PactService, checkins *service.CheckinService) *PactHandler {
	return &PactHandler{pacts: pacts, checkins: checkins}
}

type pactRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Frequency   string `json:"frequency"`
	StartDate   string `json:"start_date"`
	EndDate     string `json:"end_date"`
}

type pactResponse struct {
	ID            string `json:"id"`
	UserID        string `json:"user_id"`
	Title         string `json:"title"`
	Description   string `json:"description"`
	Frequency     string `json:"frequency"`
	Status        string `json:"status"`
	CurrentStreak int    `json:"current_streak"`
	LongestStreak int    `json:"longest_streak"`
	StartDate     string `json:"start_date"`
	EndDate       string `json:"end_date,omitempty"`
	CreatedAt     string `json:"created_at"`
	UpdatedAt     string `json:"updated_at"`
}

type checkinRequest struct {
	Date string `json:"date,omitempty"`
	Note string `json:"note,omitempty"`
}

type checkinResponse struct {
	ID        string `json:"id"`
	PactID    string `json:"pact_id"`
	UserID    string `json:"user_id"`
	Date      string `json:"date"`
	Note      string `json:"note"`
	CreatedAt string `json:"created_at"`
}

func (h *PactHandler) Create(w http.ResponseWriter, r *http.Request) {
	var request pactRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeServiceError(w, domain.ErrInvalidInput)
		return
	}
	startDate, err := parseOptionalDate(request.StartDate)
	if err != nil {
		writeServiceError(w, domain.ErrInvalidInput)
		return
	}
	endDate, err := parseOptionalDate(request.EndDate)
	if err != nil {
		writeServiceError(w, domain.ErrInvalidInput)
		return
	}
	pact, err := h.pacts.Create(r.Context(), middleware.UserID(r.Context()), service.NewPact{
		Title: request.Title, Description: request.Description,
		Frequency: domain.Frequency(request.Frequency), StartDate: startDate, EndDate: optionalTime(endDate),
	})
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, toPactResponse(pact))
}

func (h *PactHandler) List(w http.ResponseWriter, r *http.Request) {
	pacts, err := h.pacts.GetByUserID(r.Context(), middleware.UserID(r.Context()))
	if err != nil {
		writeServiceError(w, err)
		return
	}
	response := make([]pactResponse, 0, len(pacts))
	for index := range pacts {
		response = append(response, toPactResponse(&pacts[index]))
	}
	writeJSON(w, http.StatusOK, response)
}

func (h *PactHandler) Get(w http.ResponseWriter, r *http.Request) {
	pact, err := h.pacts.GetByID(r.Context(), middleware.UserID(r.Context()), r.PathValue("id"))
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toPactResponse(pact))
}

func (h *PactHandler) CreateCheckin(w http.ResponseWriter, r *http.Request) {
	var request checkinRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeServiceError(w, domain.ErrInvalidInput)
		return
	}
	date, err := parseOptionalDate(request.Date)
	if err != nil {
		writeServiceError(w, domain.ErrInvalidInput)
		return
	}
	checkin, err := h.checkins.Create(r.Context(), middleware.UserID(r.Context()), r.PathValue("id"), date, request.Note)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, toCheckinResponse(checkin))
}

func (h *PactHandler) ListCheckins(w http.ResponseWriter, r *http.Request) {
	checkins, err := h.checkins.GetByPactID(r.Context(), middleware.UserID(r.Context()), r.PathValue("id"))
	if err != nil {
		writeServiceError(w, err)
		return
	}
	response := make([]checkinResponse, 0, len(checkins))
	for index := range checkins {
		response = append(response, toCheckinResponse(&checkins[index]))
	}
	writeJSON(w, http.StatusOK, response)
}

func parseOptionalDate(value string) (time.Time, error) {
	if value == "" {
		return time.Time{}, nil
	}
	return time.Parse("2006-01-02", value)
}

func optionalTime(value time.Time) *time.Time {
	if value.IsZero() {
		return nil
	}
	return &value
}

func toPactResponse(pact *domain.Pact) pactResponse {
	response := pactResponse{
		ID: pact.ID, UserID: pact.UserID, Title: pact.Title,
		Description: pact.Description, Frequency: string(pact.Frequency), Status: string(pact.Status),
		CurrentStreak: pact.CurrentStreak, LongestStreak: pact.LongestStreak,
		StartDate: pact.StartDate.Format("2006-01-02"),
		CreatedAt: pact.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: pact.UpdatedAt.UTC().Format(time.RFC3339),
	}
	if pact.EndDate != nil {
		response.EndDate = pact.EndDate.Format("2006-01-02")
	}
	return response
}

func toCheckinResponse(checkin *domain.Checkin) checkinResponse {
	return checkinResponse{
		ID: checkin.ID, PactID: checkin.PactID, UserID: checkin.UserID,
		Date: checkin.Date.Format("2006-01-02"), Note: checkin.Note,
		CreatedAt: checkin.CreatedAt.UTC().Format(time.RFC3339),
	}
}
