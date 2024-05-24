// server.js
const express = require("express");
const { fetchQueryResult } = require("./connector");

const app = express();
const PORT = 3000;

app.use(express.static("public"));

app.get("/query", async (req, res) => {
  const title = req.query.title;
  const genres = req.query.genres; // Asegúrate de que esto coincida con el query parameter en el frontend

  let query = "";
  let params = {};

  if (title) {
    // Se corrigió la consulta para que utilice el parámetro $title y devuelva un objeto con la propiedad 'title'.
    query =
      "MATCH (movie:Movie) WHERE movie.title CONTAINS ($title) RETURN movie.title as title";
    params = { title };
  } else if (genres) {
    // Se corrigió la consulta para que utilice el parámetro $genres y devuelva un objeto con la propiedad 'title'.
    query =
      "MATCH (movie:Movie) WHERE any(g in movie.genres WHERE g = $genres) RETURN movie.title as title";
    params = { genres };
  } else {
    return res.status(400).send("Parámetros de consulta no especificados");
  }

  try {
    const results = await fetchQueryResult(query, params);
    res.json(results);
  } catch (error) {
    console.error("Error al realizar la consulta:", error);
    res.status(500).send("Error al realizar la consulta");
  }
});

app.get("/api/genre-details", async (req, res) => {
  const genre = req.query.genre;

  const query = `MATCH (m:Movie)<-[r:RATED]-(u:User) WHERE ANY(genre IN m.genres WHERE genre = '${genre}') RETURN m.title AS title, AVG(r.rating) AS averageRating ORDER BY averageRating DESC`;
  const params = { genre };

  try {
    const results = await fetchQueryResult(query, params);
    if (results.length > 0) {
      // Asegurarse de devolver todas las propiedades del node 'genre'
      console.log(results)
      res.json(
        results.map((record) => ({
          title: record.title,
          averageRating: record.averageRating,
        })),
      );
    } else {
      res.status(404).send("Película no encontrada");
    }
  } catch (error) {
    console.error("Error al obtener detalles de la película:", error);
    res.status(500).send("Error al realizar la consulta");
  }
});

// Ruta para obtener detalles completos de una película específica
app.get("/api/movie-details", async (req, res) => {
  const title = req.query.title;
  const movies = req.query;
  if (!movies) {
    return res.status(400).send("Título no especificado");
  }

  const query =
    "MATCH (movie:Movie) WHERE movie.title = $title RETURN movie AS movieDetails";
  const params = { title };

  try {
    const results = await fetchQueryResult(query, params);
    if (results.length > 0) {
      // Asegurarse de devolver todas las propiedades del nodo 'movie'.
      res.json(results[0].movieDetails.properties);
    } else {
      res.status(404).send("Película no encontrada");
    }
  } catch (error) {
    console.error("Error al obtener detalles de la película:", error);
    res.status(500).send("Error al realizar la consulta");
  }
});

app.get("/api/movies", async (req, res) => {
  const query = "MATCH (movie:Movie) RETURN movie.title as title";

  try {
    const results = await fetchQueryResult(query);
    res.json(results);
  } catch (error) {
    console.error("Error al obtener todas las películas:", error);
    res.status(500).send("Error al realizar la consulta");
  }
});

app.get("/api/users", async (req, res) => {
  const userId = req.query.id;
  console.log(req.query);
  let query = "";
  let params = {};

  if (userId) {
    query =
      "MATCH (user:User) WHERE user.userId = $userId RETURN user.userId AS user";
    params = { userId };
  } else {
    query = "MATCH (user:User) RETURN user.userId as userId";
  }

  try {
    const results = await fetchQueryResult(query, params);

    res.json(results.map((record) => record.userId));
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    res.status(500).send("Error al realizar la consulta");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

/*
COllaborative filtering
MATCH (targetUser:User {userId: 123})-[:RATED]->(movie:Movie)<-[:RATED]-(similarUser:User)
WITH similarUser, targetUser
MATCH (similarUser)-[:RATED]->(recommendedMovie:Movie)
WHERE NOT (targetUser)-[:RATED]->(recommendedMovie)
RETURN recommendedMovie.title AS RecommendedMovies, COUNT(*) AS RecommendationStrength
ORDER BY RecommendationStrength DESC
LIMIT 10
 */

/*
Rating medio de películas

MATCH (m:Movie)<-[r:RATED]-(u:User)
RETURN m.title AS Movie, AVG(r.rating) AS AverageRating
ORDER BY AverageRating DESC


MATCH (m:Movie)<-[r:RATED]-(u:User)
WHERE m.title contains 'Bambi' 
RETURN m.title AS Movie, AVG(r.rating) AS AverageRating


Ordenado por géneros
MATCH (m:Movie)<-[r:RATED]-(u:User)
WHERE ANY(genre IN m.genres WHERE genre = 'Children')
RETURN m.title AS Movie, AVG(r.rating) AS AverageRating
ORDER BY AverageRating DESC
++
 */
