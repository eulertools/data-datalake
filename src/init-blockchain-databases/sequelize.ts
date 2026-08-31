import { Sequelize } from "sequelize";
import { getSecret } from "./secrets";

const pg = require('pg');

export const newSequelize = async (chainId:string) => {

    const dbCreds:any = JSON.parse(await getSecret(`databases/chain/${chainId}`));

    return new Sequelize({
      username: dbCreds.username,
      password: dbCreds.password,
      port: dbCreds.port,
      host: dbCreds.host,
      database: dbCreds.dbname,
      dialect: 'postgres',
      protocol: 'postgres',
      logging: false,
      define: {
        timestamps: false,
      },
      dialectOptions: {
        dialectModule: pg,
        connectTimeout: 35000,
        multipleStatements: true,
        application_name: `init-blockchain-databases`,
      }
  })
}
