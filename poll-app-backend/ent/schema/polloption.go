package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// PollOption holds the schema definition for the PollOption entity.
type PollOption struct {
	ent.Schema
}

// Fields of the PollOption.
func (PollOption) Fields() []ent.Field {
	return []ent.Field{
		field.String("option_text").
			NotEmpty().
			Comment("The text of this poll option"),
		field.Int("vote_count").
			Default(0).
			Comment("Number of votes for this option"),
		field.Time("created_at").
			Default(time.Now).
			Comment("Option creation timestamp"),
	}
}

// Edges of the PollOption.
func (PollOption) Edges() []ent.Edge {
	return []ent.Edge{
		// Many options belong to one poll
		edge.From("poll", Poll.Type).
			Ref("options").
			Unique().
			Required().
			Comment("The poll this option belongs to"),
		// One option has many votes
		edge.To("votes", Vote.Type).
			Comment("Votes cast for this option"),
	}
}
