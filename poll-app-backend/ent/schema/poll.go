package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Poll holds the schema definition for the Poll entity.
type Poll struct {
	ent.Schema
}

// Fields of the Poll.
func (Poll) Fields() []ent.Field {
	return []ent.Field{
		field.String("title").
			NotEmpty().
			Comment("Poll question/title"),
		field.String("description").
			Optional().
			Comment("Optional poll description"),
		field.String("poll_type").
			Default("single_choice").
			Comment("Type of poll: single_choice, multiple_choice"),
		field.String("created_by").
			Optional().
			Comment("Email of user who created the poll"),
		field.Int("max_votes_per_user").
			Default(1).
			Comment("Maximum votes allowed per user"),
		field.Time("expires_at").
			Optional().
			Comment("When the poll expires"),
		field.Time("created_at").
			Default(time.Now).
			Comment("Poll creation timestamp"),
		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now).
			Comment("Poll last update timestamp"),
	}
}

// Edges of the Poll.
func (Poll) Edges() []ent.Edge {
	return []ent.Edge{
		// One poll has many options
		edge.To("options", PollOption.Type).
			Comment("Poll options"),
		// One poll has many votes
		edge.To("votes", Vote.Type).
			Comment("Votes cast on this poll"),
	}
}
