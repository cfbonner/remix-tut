import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";

export const loader = async () => {
  const count = await db.joke.count();
  const randomNumber = Math.floor(Math.random() * count);
  const [randomJoke] = await db.joke.findMany({
    take: 1,
    skip: randomNumber,
  });

  return json({ randomJoke });
};

export default function JokesIndexRoute() {
  const data = useLoaderData<typeof loader>();

  if (data.randomJoke !== undefined) {
    return (
      <div>
	<p>Here's a random joke:</p>
	<p>{data.randomJoke.content}</p>
	<Link to={data.randomJoke.id}>"{data.randomJoke.name}" Permalink</Link>
      </div>
    );
  } 
}
