import { json, LoaderArgs } from "@remix-run/node";
import { Link, useCatch, useLoaderData, useParams } from "@remix-run/react";

import { db } from "~/utils/db.server";

export const loader = async ({ params }: LoaderArgs) => {
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
  });

  if (!joke) {
    throw new Response("What a joke! Not found.", {
      status: 404
    });
  }

  return json({ joke });
};

export default function JokeRoute() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <h2>{data.joke.name}</h2>
      <p>{data.joke.content}</p>
      <Link to=".">"{data.joke.name}" Permalink</Link>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="error-container">Something went wrong</div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();
  if (caught.status === 404) {
    return (
      <div className="error-container">{`Could not find joke with id ${params.jokeId}`}</div>
    );
  }

  throw new Error(`Unhandled error: ${caught.status}`);
}
