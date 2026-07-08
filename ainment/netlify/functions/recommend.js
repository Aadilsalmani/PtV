exports.handler = async (event) => {

    return {

        statusCode: 200,

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            success: true,

            message: "Ainment Netlify Function is working."

        })

    };

};