const authToken = "$Token";

function randomizedDelay() {
    return new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500));
}

async function validateAuth(token) {
    const config = { Authorization: token };
    const response = await fetch(`https://major.bot/api/users/${Array.from(token).reverse().join('')}`, {
        headers: config,
    });

    if (!response.ok) {
        console.error("Error: Token validation failed");
        throw new Error();
    }
}
//code by emad khosravi
async function fetchStreak(auth) {
    const config = { Authorization: auth };
    const result = await (await fetch("https://major.bot/api/user-visits/streak/", { headers: config })).json();
    if (!result?.user_id) throw "Streak Fetch Error!";
    return result.streak;
}

async function retrieveTasks(auth) {
    const config = { Authorization: auth };
    const taskList = await Promise.all([
        fetch("https://major.bot/api/tasks/?is_daily=false", { headers: config }).then((res) => res.json()),
        fetch("https://major.bot/api/tasks/?is_daily=true", { headers: config }).then((res) => res.json()),
    ]);

    return [...new Set([...taskList[0], ...taskList[1]])];
}

async function executeTask(auth, id) {
    const config = { Authorization: auth, 'Content-Type': 'application/json' };
    const result = await (await fetch("https://major.bot/api/tasks/", {
        headers: config,
        method: "POST",
        body: JSON.stringify({ task_id: id }),
    })).json();

    return result.is_completed;
}

async function handleGame(auth, endpoint, payload = {}) {
    const config = { Authorization: auth, 'Content-Type': 'application/json' };
    const result = await (await fetch(endpoint, {
        method: "POST",
        headers: config,
        body: JSON.stringify(payload),
    })).json();

    return result.success ? result.rating_award || payload.coins : null;
}

async function main() {
    try {
        console.info("Starting MajorBot Automation...");
        await validateAuth(authToken);
        console.info("Token validated successfully.");

        const [streak, holdReward, rouletteReward, swipeReward] = await Promise.all([
            fetchStreak(authToken),
            handleGame(authToken, "https://major.bot/api/bonuses/coins/", { coins: 901 }),
            handleGame(authToken, "https://major.bot/api/roulette/"),
            handleGame(authToken, "https://major.bot/api/swipe_coin/", { coins: 2900 }),
        ]);
//code by emad khosravi
        console.info(`Streak updated: ${streak}`);
        console.info(`Hold reward: ${holdReward}`);
        console.info(`Roulette reward: ${rouletteReward}`);
        console.info(`Swipe reward: ${swipeReward}`);

        const tasks = await retrieveTasks(authToken);
        console.info(`Total tasks retrieved: ${tasks.length}`);

        for (const task of tasks) {
            await randomizedDelay();
            const completed = await executeTask(authToken, task.id);
            if (completed) {
                console.info(`Task ${task.id} completed successfully with reward: ${task.award}`);
            }
        }

        console.info("All tasks completed.");
    } catch (error) {
        console.error("An error occurred during execution.", error);
    }
}

main();
