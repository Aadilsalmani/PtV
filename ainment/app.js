const promptInput = document.querySelector("textarea");
const button = document.querySelector("button");

button.addEventListener("click", async () => {

    const prompt = promptInput.value.trim();

    if (!prompt) {
        alert("Please describe what you want to watch.");
        return;
    }

    button.disabled = true;
    button.textContent = "Thinking...";

    try {

        const response = await fetch("/.netlify/functions/recommend", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                prompt
            })

        });

        const data = await response.json();

        console.log(data);
        console.table(data.recommendations);

        alert("Response received. Check the Console (F12).");

    }

    catch (err) {

        console.error(err);

        alert("Unable to contact AI.");

    }

    button.disabled = false;
    button.textContent = "🎬 Find My Next Watch";

});