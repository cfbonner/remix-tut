import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { Link, useActionData, useCatch } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";
import { badRequest } from "~/utils/request.server";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({request}: LoaderArgs) => {
  const userId = await getUserId(request);
  if (typeof userId !== "string") {
    throw new Response("Must be logged in to submit a new joke", {
      status: 401,
    })
  }

  return json({ userId });
};

export const action = async ({ request }: ActionArgs) => {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const name = form.get("name");
  const content = form.get("content");

  if (typeof name !== "string" || typeof content !== "string") {
    return badRequest({
      fieldErrors: null,
      fields: null,
      formError: `Form not submitted correctly`,
    });
  }

  const fieldErrors = {
    name: validateJokeName(name),
    content: validateJokeContent(content),
  };

  const fields = { name, content };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fieldErrors,
      fields,
      formError: null,
    });
  }
  const joke = await db.joke.create({ 
    data: { ...fields, userId: userId }
  });

  return redirect(`/jokes/${joke.id}`);
};

function validateJokeName(name: string) {
  if (name.length < 1) {
    return `That joke's name is too short`;
  }
}

function validateJokeContent(content: string) {
  if (content.length < 1) {
    return `That joke is too short`;
  }
}

export default function NewJokeRoute() {
  const actionData = useActionData<typeof action>();

  return (
    <div>
      <h1>New joke</h1>
      <form method="post">
        <div>
          <label>
            Name:
            <input
              type="text"
              name="name"
              defaultValue={actionData?.fields?.name}
              aria-invalid={Boolean(actionData?.fieldErrors?.name) || undefined}
              aria-errormessage={
                actionData?.fieldErrors?.name ? "name-error" : undefined
              }
            />
          </label>
          {actionData?.fieldErrors?.name ? (
            <p className="form-validation-error" role="alert" id="name-error">
              {actionData.fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div>
          <label>
            Content:
            <textarea
              name="content"
              defaultValue={actionData?.fields?.content}
              aria-invalid={
                Boolean(actionData?.fieldErrors?.content) || undefined
              }
              aria-errormessage={
                actionData?.fieldErrors?.content ? "content-error" : undefined
              }
            />
          </label>
          {actionData?.fieldErrors?.content ? (
            <p
              className="form-validation-error"
              role="alert"
              id="content-error"
            >
              {actionData.fieldErrors.content}
            </p>
          ) : null}
        </div>
        <div>
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </form>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  if (caught.status === 401) {
    return (
      <div className="error-container">
      You must be logged in to submit a joke. Login or signup <Link to="/login">here.</Link>
      </div>
    );
  }

  throw new Error(`Unhandled error: ${caught.status}`);
};

export function ErrorBoundary() {
  return (
    <div className="error-container">Something went wrong</div>
  );
}
