package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
)

// User holds the schema definition for the User entity.
type User struct {
	ent.Schema
}

// Fields of the User.
func (User) Fields() []ent.Field {
	return []ent.Field{
		field.String("email").
			Unique().
			Comment("User email address for login"),
		field.String("password").
			Sensitive().
			Comment("User password (plain text for now)"),
		field.Time("created_at").
			Default(time.Now).
			Comment("User creation timestamp"),
	}
}

// Edges of the User.
func (User) Edges() []ent.Edge {
	return nil
}
