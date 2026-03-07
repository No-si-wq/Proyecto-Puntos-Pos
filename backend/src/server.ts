import "./core/config/env"

import { app } from "./app";
import { ENV } from "./core/config/env";
import { logger } from "./core/config/logger";

app.listen(ENV.PORT, "0.0.0.0", () => {
  logger.info(`API running on port ${ENV.PORT}`);
});