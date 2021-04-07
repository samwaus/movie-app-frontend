import React, { useState, useEffect } from "react";
import "./App.css";
import { CSVReader } from "react-papaparse";
import axios from "axios";

const buttonRef = React.createRef();
const bulkUploadAPI =
  "https://2e5uvbeaqj.execute-api.ap-southeast-2.amazonaws.com/dev/api/movies";
const filmWorldMovieAPI =
  "https://2e5uvbeaqj.execute-api.ap-southeast-2.amazonaws.com/dev/api/filmworld/movies";
const cinemaWorldMovieAPI =
  "https://2e5uvbeaqj.execute-api.ap-southeast-2.amazonaws.com/dev/api/cinemaworld/movies";

function App() {
  const [csvData, setCsvData] = useState([]);
  const [moviesList, setMoviesList] = useState([]);

  // preload movie data
  useEffect(() => {
    let mounted = true;

    // load movies from both APIs and consolidate if both APIs return data for the same movie name
    let movieListArray = [];

    const addMovieToArray = (movie, api) => {
      console.log("all", movieListArray, movie, api);
      if (movieListArray.length) {
        let existingMovieDataObj = movieListArray.filter(
          (movieObj) => movieObj.name === movie.name
        )[0];
        if (existingMovieDataObj) {
          // movie already exists, update the price
          existingMovieDataObj[api + "-price"] = movie.price;
        } else {
          existingMovieDataObj = { ...movie, [api + "-price"]: movie.price };
        }
        console.log("existingMovieDataObj", existingMovieDataObj);
        const movieListArrayWithoutThisMovie = movieListArray.filter(
          (movieObj) => movieObj.name !== movie.name
        );
        movieListArray = [
          ...movieListArrayWithoutThisMovie,
          existingMovieDataObj,
        ];
      } else {
        movieListArray.push({ ...movie, [api + "-price"]: movie.price });
      }
    };

    const requestOne = axios.get(filmWorldMovieAPI);
    const requestTwo = axios.get(cinemaWorldMovieAPI);

    axios
      .all([requestOne, requestTwo])
      .then(
        axios.spread((...responses) => {
          const responseOne = responses[0];
          const responseTwo = responses[1];
          if (responseOne) {
            //console.log(responseOne);
            if (responseOne.data.movies) {
              responseOne.data.movies.map((movie) => {
                addMovieToArray(movie, "filmworld");
              });
            }
          }
          if (responseTwo) {
            //console.log(responseTwo);
            if (responseTwo.data.movies) {
              responseTwo.data.movies.map((movie) => {
                addMovieToArray(movie, "cinemaworld");
              });
            }
          }
          setMoviesList(movieListArray);
          // use/access the results
        })
      )
      .catch((errors) => {
        // react on errors.
        console.log(errors);
      });

    return () => (mounted = false);
  }, []);

  const handleOpenDialog = (e) => {
    // Note that the ref is set async, so it might be null at some point
    if (buttonRef.current) {
      buttonRef.current.open(e);
    }
  };

  const handleOnFileLoad = (data) => {
    console.log(data);
    setCsvData(
      data.map((movie) => ({
        name: movie.data[0],
        price: movie.data[1],
        year: movie.data[2],
        api: movie.data[3],
      }))
    );
  };

  const handleOnError = (err, file, inputElem, reason) => {
    console.log(err);
  };

  const handleOnRemoveFile = (data) => {
    // TODO
  };

  const handleUpload = (e) => {
    // push the movie data
    if (csvData.length) {
      csvData.map((movie) => {
        axios.post(bulkUploadAPI, movie).then((success, failure) => {
          console.log(success, failure);
        });
      });
      if (buttonRef.current) {
        buttonRef.current.removeFile(e);
      }
    }
  };
  return (
    <div className="App">
      <header className="App-header">
        {/* TODO: implement cognito login functionality */}
        <p>
          It is assumed that the user is logged in using AWS Cognito user pool
          created in the backend API.
        </p>
        {moviesList && moviesList.length && (
          <table width="100%" cellPadding="20">
            <tbody>
              <tr>
                <th>Movie</th>
                <th>Film World Price</th>
                <th>Cinema World Price</th>
              </tr>
              {moviesList.map((movie, i) => {
                return (
                  <tr key={i}>
                    <td>{movie.name}</td>
                    <td>
                      {movie["filmworld-price"]
                        ? movie["filmworld-price"]
                        : "-"}
                    </td>
                    <td>
                      {movie["cinemaworld-price"]
                        ? movie["cinemaworld-price"]
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <br />
        <br />
        <hr />
        <p>
          It is assumed that the user is an admin to upload the csv and the csv
          file contains both cinamworld and filworld movie data of the last 24
          hours.
        </p>
        {/* it is assumed that the csv file doesn't contain the titles and the row data is arranged in the
            order of name, price, year, api
        */}
        <CSVReader
          ref={buttonRef}
          onFileLoad={handleOnFileLoad}
          onError={handleOnError}
          noClick
          noDrag
          onRemoveFile={handleOnRemoveFile}
        >
          {({ file }) => (
            <aside
              style={{
                display: "flex",
                flexDirection: "row",
                marginBottom: 10,
                minWidth: 400,
              }}
            >
              <button
                type="button"
                onClick={handleOpenDialog}
                style={{
                  borderRadius: 0,
                  marginLeft: 0,
                  marginRight: 10,
                  width: "40%",
                  paddingLeft: 0,
                  paddingRight: 0,
                }}
              >
                Browse file
              </button>
              <div
                style={{
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: "#ccc",
                  height: 45,
                  lineHeight: 2.5,
                  marginTop: 5,
                  marginBottom: 5,
                  paddingLeft: 13,
                  paddingTop: 3,
                  width: "60%",
                }}
              >
                {file && file.name}
              </div>
              <button
                style={{
                  borderRadius: 0,
                  marginLeft: 10,
                  marginRight: 10,
                  paddingLeft: 20,
                  paddingRight: 30,
                  minWidth: 50,
                }}
                onClick={handleUpload}
              >
                Upload
              </button>
            </aside>
          )}
        </CSVReader>
      </header>
    </div>
  );
}

export default App;
