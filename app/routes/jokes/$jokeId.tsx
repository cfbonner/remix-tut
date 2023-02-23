import { json, LoaderArgs, ActionArgs, redirect } from "@remix-run/node";
import { Link, useCatch, useLoaderData, useParams } from "@remix-run/react";

import { db } from "~/utils/db.server";
import {getUserId, requireUserId} from "~/utils/session.server";

export const loader = async ({ params, request }: LoaderArgs) => {
  const userId = await getUserId(request);
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
  });

  if (!joke) {
    throw new Response("What a joke! Not found.", {
      status: 404
    });
  }

  return json({ 
    joke,
    isOwner: joke.userId === userId,
  });
};

export const action = async({ 
  params,
  request,
}: ActionArgs) => {
  const form = await request.formData()
  if (form.get("intent") !== 'delete') {
    throw new Response(`The intent ${form.get("intent")} is not supported`, {
      status: 400,
    })
  }
  const userId = await requireUserId(request);
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
    select: { id: true, userId: true },
  })
  if (!joke) {
    throw new Response("Joke not found", {
      status: 404,
    })
  }
  if (joke.userId !== userId) {
    throw new Response("You are unauthorized to perform this action", {
      status: 403,
    })
  } 
  await db.joke.delete({ where: { id: params.jokeId }});
  return redirect(`/jokes`)
};

export default function JokeRoute() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <h2>{data.joke.name}</h2>
      <p>{data.joke.content}</p>
      <Link to=".">"{data.joke.name}" Permalink</Link>
      {data.isOwner ? (
        <form method="post">
          <input type="hidden" name="jokeId" value={data.joke.id}/>
          <button type="submit" name="intent" value="delete" className="button">Delete</button>
        </form>
      ) : null }
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
  switch (caught.status) {
    case 400: {
      return (
        <div className="error-container">What you're trying to do is not allowed.</div>
      );
    }
    case 403: {
      return (
        <div className="error-container">Sorry, but joke {params.jokeId} is not yours to delete.</div>
      );
    }
    case 404: {
      return (
        <div className="error-container">Could not find joke with id ${params.jokeId}</div>
      );
    }
  }

  throw new Error(`Unhandled error: ${caught.status}`);
}
