package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Vote holds the schema definition for the Vote entity.
type Vote struct {
	ent.Schema
}

// Fields of the Vote.
func (Vote) Fields() []ent.Field {
	return []ent.Field{
		field.String("voter_identifier").
			Optional().
			Comment("Anonymous identifier for the voter (IP, session, etc.)"),
		field.Time("created_at").
			Default(time.Now).
			Comment("When the vote was cast"),
	}
}

// Edges of the Vote.
func (Vote) Edges() []ent.Edge {
	return []ent.Edge{
		// Many votes belong to one poll
		edge.From("poll", Poll.Type).
			Ref("votes").
			Unique().
			Required().
			Comment("The poll this vote belongs to"),
		// Many votes belong to one option
		edge.From("option", PollOption.Type).
			Ref("votes").
			Unique().
			Required().
			Comment("The option this vote is for"),
	}
}
