import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const dataPath = path.join(process.cwd(), 'data');
    
    // 确保data目录存在
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }

    // 读取交易数据以获取用户信息
    const transactionsPath = path.join(dataPath, 'transactions.json');
    let transactions = [];
    
    // 如果transactions.json不存在，创建空文件
    if (!fs.existsSync(transactionsPath)) {
      fs.writeFileSync(transactionsPath, JSON.stringify([], null, 2));
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    transactions = JSON.parse(fs.readFileSync(transactionsPath, 'utf-8'));

    // 读取代理数据以获取代理信息
    const agentsPath = path.join(dataPath, 'agents.json');
    let agents = [];
    
    if (fs.existsSync(agentsPath)) {
      agents = JSON.parse(fs.readFileSync(agentsPath, 'utf-8'));
    }

    // 从交易记录中提取用户信息并计算消费总额
    const userMap = new Map();

    transactions.forEach((transaction: any) => {
      const { userId, userUsername, agentId, amount } = transaction;
      
      if (!userMap.has(userId)) {
        const agent = agents.find((a: any) => a.id === agentId);
        userMap.set(userId, {
          id: userId,
          username: userUsername,
          agentId,
          agentUsername: agent ? agent.username : '未知代理',
          totalSpent: 0,
          createdAt: transaction.createdAt
        });
      }

      const user = userMap.get(userId);
      if (transaction.status === 'completed') {
        user.totalSpent += amount;
      }
    });

    const users = Array.from(userMap.values());

    return NextResponse.json({
      success: true,
      data: users
    });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      message: error.message || '获取用户数据失败'
    }, { status: 500 });
  }
} 