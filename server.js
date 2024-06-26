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
  const genre = req.query.genre
  const limit = parseInt(req.query.limit)
  const offset = parseInt(req.query.offset)

  const query = `MATCH (m:Movie)<-[r:RATED]-(u:User) WHERE ANY(genre IN m.genres WHERE genre = '${genre}') RETURN m.title AS title, AVG(r.rating) AS averageRating ORDER BY averageRating DESC`;
  const params = { genre };

  try {
    const initialIndex = limit * offset
    const finalIndex = initialIndex + limit
    const results = await fetchQueryResult(query, params);
    if (results.length > 0) {
      // Devolver los resultados segun los parametros especificados en la request
      res.json(
        {
          totalItems: results.length,
          results: results.slice(initialIndex, finalIndex + limit).map((record) => ({
            title: record.title,
            averageRating: record.averageRating,
          })),
      }
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


  try {
    let query =
      "MATCH (movie:Movie) WHERE movie.title = $title RETURN movie AS movieDetails";
    const params = { title };

    const genreResults = await fetchQueryResult(query, params);
    if (genreResults.length > 0) {
      const genres = genreResults[0].movieDetails.properties.genres
      // Asegurarse de devolver todas las propiedades del nodo 'movie'.
      query = `WITH '${title}' AS movieTitle MATCH (m1:Movie {title: movieTitle}) MATCH (m2:Movie) WHERE m1 <> m2 AND any(genre IN m1.genres WHERE genre IN m2.genres) WITH m1, m2 MATCH (m1)<-[r1:RATED]-(u1:User) WITH m1, m2, AVG(r1.rating) AS m1AvgRating MATCH (m2)<-[r2:RATED]-(u2:User) WITH m2.title AS SimilarMovie, AVG(r2.rating) AS m2AvgRating, m1AvgRating ORDER BY abs(m2AvgRating - m1AvgRating) ASC LIMIT 10 RETURN SimilarMovie, m2AvgRating AS AverageRating`
      const recomendationResults = await fetchQueryResult(query, params)

      res.json({
        genres: genres,
        recommendations: recomendationResults
      });
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
  const limit = parseInt(req.query.limit)
  const offset = parseInt(req.query.offset)

  try {
    const initialIndex = limit * offset
    const finalIndex = initialIndex + limit

    const results = await fetchQueryResult(query);
    res.json(
        {
          totalItems: results.length,
          results: results.slice(initialIndex, finalIndex + limit).map((record) => ({
            title: record.title,
          }))
      }
);
  } catch (error) {
    console.error("Error al obtener todas las películas:", error);
    res.status(500).send("Error al realizar la consulta");
  }
});

app.get("/api/users", async (req, res) => {
  const userId = req.query.id;
  const limit = parseInt(req.query.limit)
  const offset = parseInt(req.query.offset)

  let query = "";
  let params = { };

  query = "MATCH (user:User) RETURN user.userId as userId";

  try {
    const results = await fetchQueryResult(query, params);
    const initialIndex = limit * offset
    const finalIndex = initialIndex + limit

      res.json(
        {
          totalItems: results.length,
          userIds: results.slice(initialIndex , finalIndex).map((record) => (record.userId))
      }
      );
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    res.status(500).send("Error al realizar la consulta");
  }
});

app.get('/api/user-details', async (req, res) => {
  const userId = req.query.userId

  const query = `MATCH (targetUser:User {userId: ${userId}})-[:RATED]->(movie:Movie)<-[:RATED]-(similarUser:User) WITH similarUser, targetUser MATCH (similarUser)-[:RATED]->(recommendedMovie:Movie) WHERE NOT (targetUser)-[:RATED]->(recommendedMovie) RETURN recommendedMovie.title AS RecommendedMovies, COUNT(*) AS RecommendationStrength ORDER BY RecommendationStrength DESC LIMIT 10 `
  try {
    const params = { userId }
    const results = await fetchQueryResult(query, params)

    res.json(results)
  } catch (error) {
    console.error("Error al obtener los detalles del usuario:", error);
    res.status(500).send("Error al realizar la consulta");
  }
})

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

Recomendación solo de películas
WITH 'The Matrix' AS movieTitle  // Cambia 'The Matrix' por el título de la película de interés
MATCH (m1:Movie {title: movieTitle})
MATCH (m2:Movie)
WHERE m1 <> m2 AND any(genre IN m1.genres WHERE genre IN m2.genres)
WITH m1, m2
MATCH (m1)<-[r1:RATED]-(u1:User)
WITH m1, m2, AVG(r1.rating) AS m1AvgRating
MATCH (m2)<-[r2:RATED]-(u2:User)
WITH m2.title AS SimilarMovie, AVG(r2.rating) AS m2AvgRating, m1AvgRating
ORDER BY abs(m2AvgRating - m1AvgRating) ASC
LIMIT 10
RETURN SimilarMovie, m2AvgRating AS AverageRating

 */
